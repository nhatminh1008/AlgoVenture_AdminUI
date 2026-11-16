import InstructorLink from "../workspace/InstructorLink";
import { useText } from "../../../preferences/preferencesContext";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { PageHeader } from "../workspace/PageHeader";
import { StudentIdentity } from "../classrooms/StudentIdentity";
import { useReportDate, useReportTime } from "./reportTime";

export function DueDate({ record }) {
  const reportTime = useReportTime();
  const reportDate = useReportDate();
  const text = useText();
  if (!record.due) return text("Chưa đặt hạn");
  return <time dateTime={record.cutoff ?? record.due}
    title={`${text("Hết hạn lúc")} ${reportTime(record.cutoff)} (UTC+7)`}>
    {reportDate(record.due)}
  </time>;
}

export function RecordStatus({ record, quiz = false, compact = false }) {
  const text = useText();
  const reception = {
    EXPIRED: "Hết thời gian tiếp nhận",
    CLOSED: "Đã đóng",
    ARCHIVED: "Đã lưu trữ",
  }[record.reception];
  let progress;
  if (quiz) {
    progress = record.statistics.submissions ? "Đã nộp"
      : record.applicabilityKnown ? "Chưa nộp" : "Thiếu dữ liệu lịch sử";
  } else {
    progress = !record.assignedItems ? "Không có mục thực hành"
      : record.completedItems === record.assignedItems ? "Đã hoàn thành"
      : record.completedItems > 0 ? "Hoàn thành một phần" : "Chưa hoàn thành";
  }
  return <div className="space-y-1">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{text(progress)}</span>
      {record.timing === "OVERDUE" && <span className="progress-overdue">{text("Quá hạn")}</span>}
      {record.timing === "DUE_SOON" && <span className="instructor-badge instructor-badge-draft">{text("Sắp đến hạn")}</span>}
    </div>
    {reception && !(compact && record.timing === "OVERDUE") && <div className="text-xs text-portal-muted">{text(reception)}</div>}
  </div>;
}

export function ReportLoad({ request, children }) {
  const text = useText();
  if (request.error && !request.loading) return <div className="panel flex flex-wrap items-center gap-3 p-5" role="alert">
    <span>{text(request.error)}</span>
    <button className="btn-secondary" type="button" onClick={request.refresh}>{text("Thử lại")}</button>
  </div>;
  if (!request.data || request.loading) return <p role="status" className="panel p-5">{text("Đang tải kết quả…")}</p>;
  return children(request.data);
}

export function StudentReportHeader({ backLabel, classId, className, title, children }) {
  const text = useText();
  return <>
    <InstructorBackLink>{backLabel}</InstructorBackLink>
    {className && <InstructorLink className="instructor-touch-link mb-2 flex w-fit text-sm font-semibold text-portal-purple-strong"
      to={`/instructor/classes/${classId}?tab=students`}>{text("Lớp")} · {className}</InstructorLink>}
    <PageHeader title={title}>{children}</PageHeader>
  </>;
}

export function StudentReportCard({ student, context, children }) {
  return <div className="panel mb-5">
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
      <div className="min-w-0 wrap-anywhere"><StudentIdentity name={student.name} email={student.email} /></div>
      {context && <p className="min-w-0 wrap-anywhere text-xs text-portal-muted">{context}</p>}
    </div>
    <div className="border-t border-slate-200 px-4 py-4 text-sm sm:px-5">{children}</div>
  </div>;
}
