import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useState } from "react";
import { Lock, LockOpen, Users } from "lucide-react";
import { listClassrooms, setClassroomLocked } from "./adminClassroomService";
import ClassroomMembersPanel from "./ClassroomMembersPanel";
import { listUsers } from "../users/userService";
import { AdminPageHeader } from "../AdminPageHeader";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";

export default function AdminClassroomsPage() {
  const text = useText();
  const classes = useApiData(listClassrooms, []);
  const users = useApiData(listUsers, []);
  const [membersId, setMembersId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const usersById = new Map(users.data.map((user) => [user.id, user]));
  const selected = classes.data.find(({ id }) => id === membersId);

  async function toggleLock(classroom) {
    const locked = !classroom.archivedAt;
    const prompt = locked
      ? text("Khóa lớp này? Học viên sẽ bị chặn tham gia, bắt đầu bài giao và nộp bài mới.", "Lock this class? Learners cannot join, start assignments or submit new work.")
      : text("Mở lại lớp này?", "Reopen this class?");
    if (isSubmitting || !window.confirm(prompt)) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await setClassroomLocked(classroom.id, locked);
      classes.setData((rows) => rows.map((row) => row.id === updated.id ? updated : row));
      setMessage(locked ? text("Đã khóa lớp học.", "Class locked.") : text("Đã mở lại lớp học.", "Class reopened."));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pagination = usePagination(classes.data, undefined);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Classroom Management" />
      <ApiFeedback state={classes} message={message} />
      <ApiFeedback state={users} />
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {!classes.loading && !classes.error && (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>{text("Lớp học")}</th><th>{text("Cấp độ")}</th><th>{text("Giảng viên")}</th><th>{text("Thao tác")}</th></tr></thead>
            <tbody>
              {pagination.items.map((classroom) => (
                <tr key={classroom.id}>
                  <td>{classroom.name}{classroom.archivedAt && <small className="block text-slate-500">{text("Đã khóa", "Locked")}</small>}</td>
                  <td>{getLevel(classroom.level)?.label ?? classroom.level}</td>
                  <td>{usersById.get(classroom.instructorId)?.name ?? "Giảng viên chưa xác định"}</td>
                  <td><div className="table-actions">
                    <button type="button" className="btn-row-action" onClick={() => setMembersId(classroom.id)}>
                      <Users aria-hidden="true" />{text("Thành viên")}
                    </button>
                    <button type="button" className="btn-row-action" disabled={isSubmitting} onClick={() => toggleLock(classroom)}>
                      {classroom.archivedAt ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
                      {classroom.archivedAt ? text("Mở lại lớp", "Reopen class") : text("Khóa lớp", "Lock class")}
                    </button>
                  </div></td>
                </tr>
              ))}
              {!classes.data.length && <tr><td colSpan={4}>{text("Chưa có lớp học.")}</td></tr>}
            </tbody>
          </table>
          <Pagination pagination={pagination} />
        </div>
      )}
      {selected && <ClassroomMembersPanel key={selected.id} classroom={selected}
        onClose={() => setMembersId(null)} />}
    </div>
  );
}
