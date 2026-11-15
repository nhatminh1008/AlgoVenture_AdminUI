import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import ClassNavigation from "../classrooms/ClassNavigation";
import PracticeEvidence from "./PracticeEvidence";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search, Users, ChartNoAxesColumn, TrendingUp } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { StudentIdentity } from "../classrooms/StudentIdentity";
import { ProgressMeter } from "./ProgressMeter";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";
import { exportStudentRows, downloadFile } from "./studentResultsExport";

export default function StudentProgressPage() {
  const text = useText();
  const scope = useClassroomScope();
  const { back, childState } = useInstructorNavigation(
    scope.classroom ? `/instructor/classes/${scope.classroom.id}?tab=students` : undefined,
  );
  const [query, setQuery] = useState("");
  const rows = scope.rows.filter((row) =>
    `${row.name} ${row.email}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const graded = rows.filter((row) => row.score != null);
  const assigned = rows.filter((row) => row.assignedLessons > 0);
  const pagination = usePagination(rows, scope.selected + query);
  const columns = [
    {
      key: "student", title: text("Sinh viên"), layout: "primary",
      render: (row) => <StudentIdentity name={row.name} email={row.email} />,
    },
    {
      key: "classroom", title: text("Lớp học"),
      render: (row) => (
        <Link className="instructor-touch-link inline-flex wrap-anywhere text-portal-purple-strong"
          to={`/instructor/classes/${row.classId}`} state={childState}>
          {scope.classes.find((item) => item.id === row.classId)?.name}
        </Link>
      ),
    },
    {
      key: "score", title: text("Điểm quiz / 100"),
      hint: text("Trung bình điểm cao nhất của từng quiz đã nộp"),
      render: (row) => <strong className="text-portal-ink">{row.score ?? "—"}</strong>,
    },
    {
      key: "progress", title: text("Tiến độ bài thực hành"), layout: "wide",
      render: (row) => <ProgressMeter completed={row.completedLessons} total={row.assignedLessons} percent={row.progressPercent} />,
    },
  ];
  const emptyMessage = scope.invalid
    ? text("Không tìm thấy lớp bạn phụ trách.")
    : scope.rows.length
      ? text("Không tìm thấy sinh viên phù hợp.")
      : text("Lớp chưa có sinh viên và kết quả học tập.");
  return (
    <div className="mx-auto max-w-6xl">
      {back.to && <InstructorBackLink destination={back} />}
      <PageHeader
        title={text("Tiến độ học tập")}
      >
        <button
          disabled={!rows.length}
          className="btn-secondary"
          onClick={() =>
            downloadFile(
              exportStudentRows(rows, scope.classes),
              "class-progress.csv",
            )
          }
        >
          <Download size={16} />
          {text("Xuất CSV")}
        </button>
      </PageHeader>
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="progress" />}
      <WorkspaceStats items={[
        { label: text("Sinh viên"), value: rows.length, icon: <Users /> },
        {
          label: text("Điểm quiz trung bình / 100"),
          value: graded.length
            ? Math.round(graded.reduce((sum, row) => sum + row.score, 0) / graded.length)
            : "—",
          icon: <ChartNoAxesColumn />,
        },
        {
          label: text("Tiến độ trung bình"),
          value: assigned.length
            ? `${Math.round(assigned.reduce((sum, row) => sum + row.progressPercent, 0) / assigned.length)}%`
            : "—",
          icon: <TrendingUp />,
        },
      ]} />
      <div className="panel overflow-hidden">
        <div className="instructor-compact-panel flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">{text("Tìm sinh viên")}</span>
            <Search
              size={17}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="field pl-10"
              placeholder={text("Tìm tên hoặc email...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ClassroomFilter scope={scope} />
        </div>
        <RecordTable label={text("Tiến độ học tập")} columns={columns} rows={pagination.items}
          emptyMessage={<span className="block p-3 text-center text-portal-muted">{emptyMessage}</span>} />
        <Pagination pagination={pagination} />
        <p className="border-t border-slate-100 p-4 text-xs text-slate-500">
          {rows.length} {text(" sinh viên")}
        </p>
      </div>
      {scope.classroom && <PracticeEvidence key={scope.classroom.id} classId={scope.classroom.id} />}
    </div>
  );
}
