import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import { PageHeader, StatCard, LoadState, EmptyState } from "../components/ui";
import { TrendChart, QuestionErrorTable } from "../components/ReportViews";
import {
  assignmentStats,
  scoreDistribution,
  scoreTrend,
  questionErrorStats,
} from "../data/metrics.js";
import { Link } from "react-router-dom";

export default function Analytics() {
  const scope = useClassScope();
  if (scope.loading || scope.error)
    return <LoadState {...scope} retry={scope.refresh} />;
  const stats = scope.selectedAssignments.map((assignment) =>
    assignmentStats(assignment, scope.members, scope.history),
  );
  const best = stats.flatMap((item) => item.best);
  const errors = scope.selectedAssignments
    .flatMap((assignment) =>
      questionErrorStats(assignment, scope.history, scope.members),
    )
    .sort(
      (a, b) =>
        b.missedPercent - a.missedPercent || b.missedCount - a.missedCount,
    );
  const distribution = scoreDistribution(best);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb="Giảng viên / Báo cáo học tập"
        title="Phân tích lớp học"
      />
      <ClassFilter scope={scope} assignments />
      {scope.invalid ? (
        <div className="mt-6">
          <EmptyState title="Không tìm thấy lớp hoặc bài tập được phép xem" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Bài tập đã giao" value={stats.length} />
            <StatCard title="Lượt nộp" value={scope.history.length} />
            <StatCard
              title="Điểm tốt nhất trung bình"
              value={
                best.length
                  ? `${Math.round(best.reduce((sum, item) => sum + item.scorePercent, 0) / best.length)}%`
                  : "—"
              }
              note="Theo cặp học viên–bài tập đã nộp"
            />
          </div>
          <section className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bài tập</th>
                  <th>Hoàn thành</th>
                  <th>Học viên đã nộp</th>
                  <th>Điểm tốt nhất TB</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.completion}%</td>
                    <td>
                      {item.submitted}/{item.learners}
                    </td>
                    <td>{item.average === null ? "—" : `${item.average}%`}</td>
                  </tr>
                ))}
                {!stats.length && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Chưa có bài tập đã giao.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="panel min-w-0 p-6">
              <h2 className="font-bold">Phân bố điểm tốt nhất</h2>
              <p className="mt-2 text-xs text-slate-500">
                Mỗi học viên–bài tập có lượt nộp đóng góp một điểm tốt nhất.
              </p>
              {best.length ? (
                <div className="mt-5 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} width={30} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Số kết quả"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-400">
                  Chưa có điểm để thống kê.
                </p>
              )}
            </section>
            <TrendChart data={scoreTrend(scope.history)} />
          </div>
          <QuestionErrorTable rows={errors} />
          <section className="panel p-6">
            <h2 className="font-bold">Phân tích từng học viên</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {scope.members.map((member) => (
                <Link
                  className="btn-secondary"
                  key={member.id}
                  to={`/classes/${scope.classId}/learners/${member.learnerId}`}
                >
                  {member.learnerName}
                </Link>
              ))}
              {!scope.members.length && (
                <p className="text-sm text-slate-500">Lớp chưa có học viên.</p>
              )}
            </div>
          </section>
          <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
            Các biểu đồ này tính từ lượt làm và điểm số. Mức thành thạo theo
            Knowledge Tracing sẽ do adaptive engine cung cấp sau; portal không
            suy diễn mastery từ điểm.
          </p>
        </div>
      )}
    </div>
  );
}
