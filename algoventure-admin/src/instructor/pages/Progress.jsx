import ClassNavigation from "../components/ClassNavigation";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search, Users, ChartNoAxesColumn, TrendingUp } from "lucide-react";
import { PageHeader, MetricCard, StudentIdentity, ProgressMeter } from "../components/ui";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import { exportStudentRows, downloadFile } from "../data/classroom";
import { getTopic } from "../data/curriculum";

export default function Progress() {
  const scope = useClassScope();
  const [query, setQuery] = useState("");
  const rows = scope.rows.filter((row) =>
    `${row.name} ${row.email}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const graded = rows.filter((row) => row.score != null);
  const assigned = rows.filter((row) => row.assignedLessons > 0);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Tiến độ học tập"
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
          Xuất CSV
        </button>
      </PageHeader>
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="progress" />}
      <div className="instructor-metrics">
        <MetricCard label="Sinh viên" value={rows.length} icon={<Users size={22} />} />
        <MetricCard label="Điểm quiz trung bình / 100" value={graded.length ? Math.round(graded.reduce((sum, row) => sum + row.score, 0) / graded.length) : "—"} icon={<ChartNoAxesColumn size={22} />} />
        <MetricCard label="Tiến độ trung bình" value={assigned.length ? `${Math.round(assigned.reduce((sum, row) => sum + row.progressPercent, 0) / assigned.length)}%` : "—"} icon={<TrendingUp size={22} />} />
      </div>
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Tìm sinh viên</span>
            <Search
              size={17}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="field pl-10"
              placeholder="Tìm tên hoặc email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ClassFilter scope={scope} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Lớp học</th>
                <th>Chủ đề</th>
                <th title="Trung bình điểm cao nhất của từng quiz đã nộp">Điểm quiz / 100</th>
                <th>Tiến độ bài thực hành</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const classroom = scope.classes.find(
                  (item) => item.id === row.classId,
                );
                return (
                  <tr key={row.id}>
                    <td>
                      <StudentIdentity name={row.name} email={row.email} />
                    </td>
                    <td>
                      <Link
                        className="text-portal-purple-strong"
                        to={`/instructor/classes/${row.classId}`}
                      >
                        {classroom.name}
                      </Link>
                    </td>
                    <td>{getTopic(classroom.topicId).name}</td>
                    <td><strong className="text-portal-ink">{row.score ?? "—"}</strong></td>
                    <td><ProgressMeter completed={row.completedLessons} total={row.assignedLessons} percent={row.progressPercent} /></td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    {scope.invalid
                      ? "Không tìm thấy lớp bạn phụ trách."
                      : scope.rows.length
                        ? "Không tìm thấy sinh viên phù hợp."
                        : "Lớp chưa có sinh viên và kết quả học tập."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 p-4 text-xs text-slate-500">
          {rows.length} sinh viên
        </p>
      </div>
    </div>
  );
}
