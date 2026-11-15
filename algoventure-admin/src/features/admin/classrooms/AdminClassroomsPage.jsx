import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useState } from "react";
import { Lock, LockOpen, Users } from "lucide-react";
import { listClassrooms, setClassroomLocked } from "./adminClassroomService";
import ClassroomDetailsPanel from "./ClassroomDetailsPanel";
import { listUsers } from "../users/userService";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordTable from "../../../shared/components/RecordTable";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";

export default function AdminClassroomsPage() {
  const text = useText();
  const classes = useApiData(listClassrooms, []);
  const users = useApiData(listUsers, []);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const usersById = new Map(users.data.map((user) => [user.id, user]));
  const selected = classes.data.find(({ id }) => id === selectedClassId);

  async function changeLock(classroom) {
    const locked = !classroom.archivedAt;
    const confirmation = locked
      ? text(`Khóa lớp “${classroom.name}”? Học viên sẽ không thể tham gia lớp, mở bài được giao hoặc nộp bài mới.`,
          `Lock “${classroom.name}”? Learners will be unable to join, open assigned work, or submit new work.`)
      : text(`Mở khóa lớp “${classroom.name}”?`, `Unlock “${classroom.name}”?`);
    if (isSubmitting || !window.confirm(confirmation)) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await setClassroomLocked(classroom.id, locked);
      classes.setData((rows) => rows.map((row) => row.id === updated.id ? updated : row));
      setMessage(locked ? text("Đã khóa lớp học.", "Classroom locked.") : text("Đã mở khóa lớp học.", "Classroom unlocked."));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pagination = usePagination(classes.data, undefined);
  const columns = [
    {
      key: "name", title: text("Lớp học"), layout: "primary",
      render: (classroom) => <>
        {classroom.name}
        {classroom.archivedAt && <small className="block text-slate-500">{text("Đã khóa", "Locked")}</small>}
      </>,
    },
    { key: "level", title: text("Cấp độ"), render: (classroom) => getLevel(classroom.level)?.label ?? classroom.level },
    {
      key: "instructor", title: text("Giảng viên"),
      render: (classroom) => usersById.get(classroom.instructorId)?.name ?? text("Giảng viên chưa xác định", "Unknown instructor"),
    },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (classroom) => (
        <div className="table-actions">
          <button type="button" className="btn-row-action" onClick={() => setSelectedClassId(classroom.id)}>
            <Users aria-hidden="true" />{text("Xem lớp", "View classroom")}
          </button>
          <button type="button"
            className={classroom.archivedAt ? "btn-row-action" : "btn-row-action btn-row-action-danger"}
            disabled={isSubmitting} onClick={() => changeLock(classroom)}>
            {classroom.archivedAt
              ? <><LockOpen aria-hidden="true" />{text("Mở khóa", "Unlock")}</>
              : <><Lock aria-hidden="true" />{text("Khóa", "Lock")}</>}
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Classroom Management" />
      <ApiFeedback state={classes} message={message} />
      <ApiFeedback state={users} />
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {!classes.loading && !classes.error && (
        <div className="panel overflow-hidden">
          <RecordTable label={text("Lớp học")} columns={columns} rows={pagination.items}
            emptyMessage={text("Chưa có lớp học.")} />
          <Pagination pagination={pagination} />
        </div>
      )}
      {selected && <ClassroomDetailsPanel key={selected.id} classroom={selected}
        onClose={() => setSelectedClassId(null)} />}
    </div>
  );
}
