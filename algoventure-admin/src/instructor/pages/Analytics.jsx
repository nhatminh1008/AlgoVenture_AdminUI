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
import { PageHeader } from "../components/ui";
import ClassFilter, { useClassScope } from "../components/ClassFilter";

export default function Analytics() {
  const scope = useClassScope();
  const graded = scope.rows.filter((row) => row.score !== null);
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
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Phân tích lớp học">
        <ClassFilter scope={scope} />
      </PageHeader>
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="analytics" />}
      <p className="mb-6 text-sm leading-6 text-slate-500">
        {scope.classroom
          ? scope.classroom.name
          : scope.invalid
            ? "Lớp không khả dụng."
            : "Tổng hợp các lớp bạn phụ trách."}{" "}
        Điểm quiz và tiến độ bài giao được lấy từ dữ liệu học viên trên máy chủ.
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Sinh viên trong lớp", scope.rows.length],
          [
            "Bộ bài đang giao",
            scope.sets.filter((item) => item.status === "Active").length +
              scope.quizzes.filter((item) => item.status === "Published")
                .length,
          ],
          [
            "Điểm trung bình",
            average === null ? "Chưa có dữ liệu" : `${average}/100`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="panel p-6">
            <p className="mb-3 text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel min-w-0 p-6">
          <h2 className="font-bold text-slate-900">Sinh viên theo lớp</h2>
          <p className="mt-1 text-xs text-slate-500">
            Số thành viên từ danh sách đăng ký lớp
          </p>
          {scope.rows.length ? (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart}
                  margin={{ left: 0, right: 12, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(name) =>
                      name.length > 20 ? `${name.slice(0, 18)}…` : name
                    }
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} width={25} />
                  <Tooltip />
                  <Bar
                    dataKey="students"
                    name="Sinh viên"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={55}
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
          <h2 className="font-bold text-slate-900">
            Mức thành thạo theo khái niệm
          </h2>
          <div className="my-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="font-medium text-slate-600">
              Chưa có dữ liệu ước lượng
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Mức thành thạo sẽ hiển thị khi có đủ dữ liệu học tập của sinh viên.
            </p>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Điểm thực hành và mức thành thạo do mô hình ước lượng là hai chỉ số
            riêng.
          </p>
        </section>
      </div>
    </div>
  );
}
