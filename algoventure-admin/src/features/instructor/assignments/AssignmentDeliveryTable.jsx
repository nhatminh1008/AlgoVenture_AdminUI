import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import InstructorLink from "../workspace/InstructorLink";
import { progressResultsPath } from "../workspace/useInstructorNavigation";

const statuses = { Draft: "Bản nháp", Active: "Đang giao", Closed: "Đã đóng" };

export default function AssignmentDeliveryTable({ pagination, classroom, classes = [], showClass = false, emptyMessage }) {
  const text = useText();
  const columns = [
    { key: "title", title: text("Bộ thử thách"), layout: "primary", render: (row) => <strong>{row.title}</strong> },
    ...(showClass ? [{ key: "class", title: text("Lớp học"), render: (row) => classes.find((item) => item.id === row.classId)?.name }] : []),
    { key: "lessons", title: text("Mục thực hành"), render: (row) => row.lessonIds.length },
    { key: "due", title: text("Hạn (UTC+7)"), render: (row) => row.due || text("Chưa đặt") },
    { key: "recipients", title: text("Người nhận", "Recipients"), render: (row) => row.status === "Draft" ? "—" : row.recipientCount },
    {
      key: "status", title: text("Trạng thái"),
      render: (row) => {
        const archived = row.archivedAt || classroom?.archivedAt || classes.find((item) => item.id === row.classId)?.archivedAt;
        return <span className={`instructor-badge${archived || row.status === "Closed" ? " instructor-badge-closed" : ""}`}>
          {text(archived ? "Đã lưu trữ" : statuses[row.status] ?? row.status)}
        </span>;
      },
    },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (row) => {
        const canEdit = classroom && !classroom.archivedAt && !row.archivedAt && row.status === "Draft" && row.assignmentTemplateId;
        const params = new URLSearchParams({ classId: row.classId });
        params.set(canEdit ? "assignmentTemplateId" : "assignmentId", canEdit ? row.assignmentTemplateId : row.id);
        return <div className="table-actions">
          {classroom && <InstructorLink className="btn-row-action" to={`/instructor/challenges?${params}`}>
            {canEdit ? text("Chỉnh sửa") : text("Xem bộ bài", "View set")}
          </InstructorLink>}
          {row.status !== "Draft" && <InstructorLink className="btn-row-action"
            to={progressResultsPath(row.classId, "assignments", row.id)}>
            {text("Xem kết quả", "View results")}
          </InstructorLink>}
        </div>;
      },
    },
  ];
  return <div className="panel overflow-hidden">
    <RecordTable label={text("Bộ thử thách được giao")} columns={columns} rows={pagination.items} emptyMessage={emptyMessage} />
    <Pagination pagination={pagination} />
  </div>;
}
