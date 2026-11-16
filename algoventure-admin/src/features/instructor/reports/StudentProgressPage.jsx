import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import ClassNavigation from "../classrooms/ClassNavigation";
import { Download, Users, ChartNoAxesColumn, TrendingUp } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { StudentIdentity } from "../classrooms/StudentIdentity";
import { ProgressMeter } from "./ProgressMeter";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";
import { exportStudentRows, downloadFile } from "./studentResultsExport";
import { OverdueLink, StudentListControls, StudentProgressLink } from "./StudentProgressLinks";
import { filterStudents } from "./filterStudents";
import { useInstructorParams } from "../workspace/useInstructorParams";

export default function StudentProgressPage() {
  const text = useText();
  const scope = useClassroomScope();
  const controls = useInstructorParams();
  const query = controls.params.get("q") ?? "";
  const overdue = controls.params.get("overdue") === "1";
  const rows = filterStudents(scope.rows, query, overdue);
  const graded = rows.filter((row) => row.score != null);
  const assigned = rows.filter((row) => row.assignedLessons > 0);
  const pagination = usePagination(rows, scope.selected, controls);
  const columns = [
    {
      key: "student", title: text("Sinh viên"), layout: "primary",
      render: (row) => <StudentIdentity name={row.name} email={row.email} />,
    },
    {
      key: "classroom", title: text("Lớp học"),
      render: (row) => (
        <InstructorLink className="instructor-touch-link inline-flex wrap-anywhere text-portal-purple-strong"
          to={`/instructor/classes/${row.classId}`}>
          {scope.classes.find((item) => item.id === row.classId)?.name}
        </InstructorLink>
      ),
    },
    {
      key: "score", title: text("Điểm quiz / 100"),
      hint: text("Trung bình điểm cao nhất của từng quiz đã nộp"),
      render: (row) => <strong className="text-portal-ink">{row.score ?? "—"}</strong>,
    },
    {
      key: "progress", title: text("Mục thực hành"), layout: "wide",
      render: (row) => <ProgressMeter completed={row.completedLessons} total={row.assignedLessons} percent={row.progressPercent} />,
    },
    { key: "submitted", title: text("Quiz đã nộp"), render: (row) => row.quizzesSubmitted },
    { key: "overdue", title: text("Bài quá hạn"), render: (row) => <OverdueLink row={row} /> },
    { key: "actions", title: text("Thao tác"), layout: "actions", render: (row) => <StudentProgressLink row={row} /> },
  ];
  const emptyMessage = scope.invalid
    ? text("Không tìm thấy lớp bạn phụ trách.")
    : scope.rows.length
      ? text("Không tìm thấy sinh viên phù hợp.")
      : text("Lớp chưa có sinh viên và kết quả học tập.");
  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink />
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
        { label: scope.classroom ? text("Sinh viên") : text("Lượt ghi danh theo lớp"), value: rows.length, icon: <Users /> },
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
        <StudentListControls query={query} overdue={overdue}
          onQuery={(value) => controls.set("q", value, true)}
          onOverdue={(value) => controls.set("overdue", value ? "1" : "", true)}>
          <ClassroomFilter scope={scope} />
        </StudentListControls>
        <RecordTable label={text("Tiến độ học tập")} columns={columns} rows={pagination.items}
          emptyMessage={<span className="block p-3 text-center text-portal-muted">{emptyMessage}</span>} />
        <Pagination pagination={pagination} />
        <p className="border-t border-slate-100 p-4 text-xs text-slate-500">
          {rows.length} {scope.classroom ? text("sinh viên") : text("lượt ghi danh")}
        </p>
      </div>
    </div>
  );
}
