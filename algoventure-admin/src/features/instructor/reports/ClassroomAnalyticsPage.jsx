import { useText } from "../../../preferences/preferencesContext";
import ClassNavigation from "../classrooms/ClassNavigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Layers, ChartNoAxesColumn, GraduationCap } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";

const axisColor = "var(--portal-muted)";
const tooltipStyle = {
  backgroundColor: "var(--portal-surface)",
  color: "var(--portal-ink)",
  borderColor: "var(--portal-line-strong)",
  borderRadius: 12,
  fontSize: 14,
};
const tooltipItemStyle = { color: "var(--portal-ink)" };
const tooltipCursor = { fill: "var(--portal-lavender)" };

export default function ClassroomAnalyticsPage() {
  const text = useText();
  const scope = useClassroomScope();
  const archivedClassIds = new Set(scope.classes.filter((item) => item.archivedAt).map((item) => item.id));
  const graded = scope.rows.filter((row) => row.score != null);
  const average = graded.length
    ? Math.round(
        graded.reduce((sum, row) => sum + row.score, 0) / graded.length,
      )
    : null;
  const chart = scope.classes
    .filter((item) => !scope.selected || item.id === scope.selected)
    .map((item) => ({
      name: item.name,
      students: scope.rows.filter((row) => row.classId === item.id).length,
    }));
  const distribution = [["0–49", 0, 50], ["50–69", 50, 70], ["70–84", 70, 85], ["85–100", 85, 101]].map(([name, min, max]) => ({ name, students: graded.filter((row) => row.score >= min && row.score < max).length }));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={text("Phân tích lớp học")}>
        <ClassroomFilter scope={scope} />
      </PageHeader>
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="analytics" />}
      {scope.invalid && <p role="alert" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{text("Lớp không khả dụng.")}</p>}
      <div className="[&_.workspace-stats]:grid-cols-2 lg:[&_.workspace-stats]:grid-cols-4">
      <WorkspaceStats items={[
        { label: text(scope.classroom ? "Sinh viên" : "Lượt ghi danh theo lớp"), value: scope.rows.length, icon: <Users /> },
        {
          label: text("Bộ thử thách đang giao"),
          value: scope.sets.filter((item) => !item.archivedAt && !archivedClassIds.has(item.classId) && item.status === "Active").length,
          icon: <Layers />,
        },
        { label: text("Quiz đã công bố"), value: scope.quizzes.filter((item) =>
          !item.archivedAt && !archivedClassIds.has(item.classId) && item.status === "Published").length, icon: <GraduationCap /> },
        { label: text("Điểm quiz trung bình / 100"), value: average ?? "—", icon: <ChartNoAxesColumn /> },
      ]} />
      </div>
      <p className="mb-4 text-sm text-portal-muted">
        {text("Điểm của mỗi sinh viên là trung bình điểm cao nhất của từng quiz đã nộp.")}
        {!scope.selected && ` ${text("Sinh viên học nhiều lớp được tính một lần trong mỗi lớp.")}`}
      </p>
      <div className="analytics-layout">
        <section className="instructor-compact-panel panel min-w-0 p-6">
          <h2 className="instructor-chart-title"><GraduationCap size={19} />{text("Sinh viên theo lớp")}</h2>
          {scope.rows.length ? (
            <div className="mt-5" style={{ height: Math.max(256, chart.length * 42) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart}
                  layout="vertical"
                  margin={{ left: 0, right: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="var(--portal-line)" strokeDasharray="3 5" horizontal={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickFormatter={(name) =>
                      name.length > 15 ? `${name.slice(0, 13)}…` : name
                    }
                    tick={{ fill: axisColor, fontSize: 13 }}
                    interval={0}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: axisColor, fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={tooltipCursor} contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Bar
                    dataKey="students"
                    name="Sinh viên"
                    fill="var(--portal-purple)"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">
              {text("Chưa có sinh viên để thống kê.")}
            </p>
          )}
        </section>
        <section className="instructor-compact-panel panel p-6">
          <h2 className="instructor-chart-title"><ChartNoAxesColumn size={19} />{text("Phân bố điểm quiz")}</h2>
          {graded.length ? (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ left: 0, right: 12, bottom: 15 }}>
                  <CartesianGrid stroke="var(--portal-line)" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: 14 }} />
                  <YAxis allowDecimals={false} width={25} stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip cursor={tooltipCursor} contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Bar dataKey="students" name="Sinh viên" fill="var(--portal-purple)" radius={[7, 7, 0, 0]} maxBarSize={55} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="instructor-empty"><ChartNoAxesColumn /><p>{text("Chưa có điểm quiz")}</p></div>}
        </section>
      </div>
    </div>
  );
}
