import ClassNavigation from "../components/ClassNavigation";
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
import { PageHeader, MetricCard } from "../components/ui";
import ClassFilter, { useClassScope } from "../components/ClassFilter";

export default function Analytics() {
  const scope = useClassScope();
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
      <PageHeader title="Phân tích lớp học">
        <ClassFilter scope={scope} />
      </PageHeader>
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="analytics" />}
      {scope.invalid && <p role="alert" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Lớp không khả dụng.</p>}
      <div className="instructor-metrics">
        <MetricCard label="Sinh viên" value={scope.rows.length} icon={<Users size={22} />} />
        <MetricCard label="Bộ bài đang giao" value={scope.sets.filter((item) => item.status === "Active").length + scope.quizzes.filter((item) => item.status === "Published").length} icon={<Layers size={22} />} />
        <MetricCard label="Điểm quiz trung bình / 100" value={average ?? "—"} icon={<ChartNoAxesColumn size={22} />} />
      </div>
      <div className="analytics-layout">
        <section className="panel min-w-0 p-6">
          <h2 className="instructor-chart-title"><GraduationCap size={19} />Sinh viên theo lớp</h2>
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
                    tick={{ fontSize: 13 }}
                    interval={0}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--portal-lavender)" }} contentStyle={{ borderRadius: 12, borderColor: "var(--portal-line)", fontSize: 14 }} />
                  <Bar
                    dataKey="students"
                    name="Sinh viên"
                    fill="#242424"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">
              Chưa có sinh viên để thống kê.
            </p>
          )}
        </section>
        <section className="panel p-6">
          <h2 className="instructor-chart-title"><ChartNoAxesColumn size={19} />Phân bố điểm quiz</h2>
          {graded.length ? <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution} margin={{ left: 0, right: 12, bottom: 15 }}><CartesianGrid stroke="var(--portal-line)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 14 }} /><YAxis allowDecimals={false} width={25} /><Tooltip cursor={{ fill: "var(--portal-yellow-soft)" }} contentStyle={{ borderRadius: 12, borderColor: "var(--portal-line)", fontSize: 14 }} /><Bar dataKey="students" name="Sinh viên" fill="var(--portal-purple)" radius={[7, 7, 0, 0]} maxBarSize={55} isAnimationActive={false} /></BarChart></ResponsiveContainer></div> : <div className="instructor-empty"><ChartNoAxesColumn /><p>Chưa có điểm quiz</p></div>}
        </section>
      </div>
    </div>
  );
}
