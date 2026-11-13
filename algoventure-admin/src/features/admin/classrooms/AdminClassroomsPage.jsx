import { useState } from "react";
import { archiveClassroom, listClassrooms, saveClassroom } from "./adminClassroomService";
import AdminClassroomForm from "./AdminClassroomForm";
import ClassroomMembersPanel from "./ClassroomMembersPanel";
import { listUsers } from "../users/userService";
import { AdminPageHeader } from "../AdminPageHeader";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";
import { getLevel, getTopic } from "../../../shared/curriculum/curriculumCatalog";

const INITIAL_CLASSROOM_FORM = { name: "", description: "", topicId: "", level: "basic", instructorId: "" };

export default function AdminClassroomsPage() {
  const classes = useApiData(listClassrooms, []);
  const users = useApiData(listUsers, []);
  const [editor, setEditor] = useState(null);
  const [membersId, setMembersId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const instructors = users.data.filter(({ role, status }) => role === "instructor" && status === "Active");
  const usersById = new Map(users.data.map((user) => [user.id, user]));
  const selected = classes.data.find(({ id }) => id === membersId);

  function edit(classroom) {
    setEditor(classroom);
    setError("");
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    const { id, name, description, topicId, level, instructorId } = editor;
    const saved = await mutate(() => saveClassroom(id, {
      name: name.trim(), description: description.trim(), topicId, level, instructorId,
    }), id ? "Đã cập nhật lớp học." : "Đã tạo lớp học.");
    if (!saved) return;
    classes.setData((rows) => rows.some((row) => row.id === saved.id) && id
      ? rows.map((row) => row.id === saved.id ? saved : row)
      : [saved, ...rows.filter((row) => row.id !== saved.id)]);
    setEditor((current) => (current === editor ? null : current));
  }

  async function archive(classroom) {
    if (!window.confirm(`Lưu trữ lớp “${classroom.name}”? Lịch sử lớp học sẽ được giữ lại.`)) return;
    const result = await mutate(() => archiveClassroom(classroom.id), "Đã lưu trữ lớp học.");
    if (result === undefined) return;
    setEditor((current) => (current?.id === classroom.id ? null : current));
    await classes.refresh();
  }

  async function mutate(action, success) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setMessage(success);
      return result;
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Classroom Management">
        <button type="button" className="btn-primary" disabled={isSubmitting || users.loading || !!users.error}
          onClick={() => edit({ ...INITIAL_CLASSROOM_FORM })}>Tạo lớp học</button>
      </AdminPageHeader>
      <ApiFeedback state={classes} message={message} />
      <ApiFeedback state={users} />
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {editor && (
        <AdminClassroomForm
          editor={editor}
          instructors={instructors}
          usersById={usersById}
          isSubmitting={isSubmitting}
          onSubmit={save}
          onChange={setEditor}
          onCancel={() => edit(null)}
        />
      )}
      {!classes.loading && !classes.error && (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Lớp học</th><th>Chủ đề</th><th>Giảng viên</th><th>Thao tác</th></tr></thead>
            <tbody>
              {classes.data.map((classroom) => (
                <tr key={classroom.id}>
                  <td>{classroom.name}{classroom.archivedAt && <small className="block text-slate-500">Đã lưu trữ</small>}</td>
                  <td>{getTopic(classroom.topicId)?.label ?? classroom.topicId} · {getLevel(classroom.level)?.label ?? classroom.level}</td>
                  <td>{usersById.get(classroom.instructorId)?.name ?? "Giảng viên chưa xác định"}</td>
                  <td><div className="flex flex-wrap gap-3">
                    <button type="button" className="text-portal-purple-strong"
                      onClick={() => setMembersId(classroom.id)}>Thành viên</button>
                    {!classroom.archivedAt && <>
                      <button type="button" className="text-portal-purple-strong" disabled={isSubmitting || users.loading || !!users.error}
                        onClick={() => edit(classroom)}>Sửa lớp</button>
                      <button type="button" className="text-red-700" disabled={isSubmitting}
                        onClick={() => archive(classroom)}>Lưu trữ</button>
                    </>}
                  </div></td>
                </tr>
              ))}
              {!classes.data.length && <tr><td colSpan={4}>Chưa có lớp học.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {selected && <ClassroomMembersPanel key={selected.id} classroom={selected} users={users.data}
        onClose={() => setMembersId(null)} />}
    </div>
  );
}
