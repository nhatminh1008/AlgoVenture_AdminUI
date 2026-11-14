import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
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
  const text = useText();
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
    }), id ? text("Đã cập nhật lớp học.") : text("Đã tạo lớp học."));
    if (!saved) return;
    classes.setData((rows) => rows.some((row) => row.id === saved.id) && id
      ? rows.map((row) => row.id === saved.id ? saved : row)
      : [saved, ...rows.filter((row) => row.id !== saved.id)]);
    setEditor((current) => (current === editor ? null : current));
  }

  async function archive(classroom) {
    if (!window.confirm(text(
      `Lưu trữ lớp “${classroom.name}”? Lớp sẽ chuyển sang chỉ xem. Học viên không thể tham gia lớp, mở bài được giao hoặc nộp bài mới. Điểm và lịch sử hiện có vẫn được giữ.`,
      `Archive “${classroom.name}”? This class becomes read-only. Learners cannot join or start and submit new assignments. Existing scores and history are preserved.`,
    ))) return;
    const result = await mutate(() => archiveClassroom(classroom.id), "Đã lưu trữ lớp học. Lớp hiện chỉ xem và không nhận bài nộp mới.");
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

  const pagination = usePagination(classes.data, undefined);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Classroom Management">
        <button type="button" className="btn-primary" disabled={isSubmitting || users.loading || !!users.error}
          onClick={() => edit({ ...INITIAL_CLASSROOM_FORM })}>{text("Tạo lớp học")}</button>
      </AdminPageHeader>
      <p className="mb-4 text-sm">{text("Lưu trữ đưa lớp về chế độ chỉ xem, giữ điểm và lịch sử, đồng thời đóng bài được giao trong Unity.", "Archiving makes the class read-only, keeps scores and history, and closes its Unity assignments.")}</p>
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
            <thead><tr><th>{text("Lớp học")}</th><th>{text("Chủ đề")}</th><th>{text("Giảng viên")}</th><th>{text("Thao tác")}</th></tr></thead>
            <tbody>
              {pagination.items.map((classroom) => (
                <tr key={classroom.id}>
                  <td>{classroom.name}{classroom.archivedAt && <small className="block text-slate-500">{text("Đã lưu trữ")}</small>}</td>
                  <td>{getTopic(classroom.topicId)?.label ?? classroom.topicId} · {getLevel(classroom.level)?.label ?? classroom.level}</td>
                  <td>{usersById.get(classroom.instructorId)?.name ?? "Giảng viên chưa xác định"}</td>
                  <td><div className="flex flex-wrap gap-3">
                    <button type="button" className="text-portal-purple-strong"
                      onClick={() => setMembersId(classroom.id)}>{text("Thành viên")}</button>
                    {!classroom.archivedAt && <>
                      <button type="button" className="text-portal-purple-strong" disabled={isSubmitting || users.loading || !!users.error}
                        onClick={() => edit(classroom)}>{text("Sửa lớp")}</button>
                      <button type="button" className="text-red-700" disabled={isSubmitting}
                        onClick={() => archive(classroom)}>{text("Lưu trữ")}</button>
                    </>}
                  </div></td>
                </tr>
              ))}
              {!classes.data.length && <tr><td colSpan={4}>{text("Chưa có lớp học.")}</td></tr>}
            </tbody>
          </table>
          <Pagination pagination={pagination} />
        </div>
      )}
      {selected && <ClassroomMembersPanel key={selected.id} classroom={selected} users={users.data}
        onClose={() => setMembersId(null)} />}
    </div>
  );
}
