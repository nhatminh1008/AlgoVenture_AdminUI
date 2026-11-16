import InstructorLink from "../workspace/InstructorLink";
import { Search } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import { studentProgressPath } from "./progressService";

export function StudentProgressLink({ row }) {
  const text = useText();
  return <InstructorLink className="btn-row-action" to={studentProgressPath(row.classId, row.id)}
    aria-label={`${text("Xem tiến độ")} · ${row.name} · ${row.email}`}>{text("Xem tiến độ")}</InstructorLink>;
}

export function OverdueLink({ row }) {
  const text = useText();
  const count = (row.overdueAssignments ?? 0) + (row.overdueQuizzes ?? 0);
  return count ? <InstructorLink className="instructor-touch-link inline-flex font-semibold text-portal-purple-strong"
    to={`${studentProgressPath(row.classId, row.id)}?filter=overdue`}
    aria-label={`${row.name} · ${count} ${text("bài quá hạn")}`}>{count}</InstructorLink> : "0";
}

export function StudentListControls({ query, overdue, onQuery, onOverdue, children }) {
  const text = useText();
  return <div className="instructor-compact-panel flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
    <label className="relative min-w-48 flex-1">
      <span className="sr-only">{text("Tìm sinh viên")}</span>
      <Search size={17} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" />
      <input className="field pl-10" placeholder={text("Tìm tên hoặc email...")} value={query}
        onChange={(event) => onQuery(event.target.value)} />
    </label>
    {children}
    <label className="inline-flex min-h-10 items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={overdue} onChange={(event) => onOverdue(event.target.checked)}
        className="accent-portal-purple" />
      {text("Có bài quá hạn")}
    </label>
  </div>;
}
