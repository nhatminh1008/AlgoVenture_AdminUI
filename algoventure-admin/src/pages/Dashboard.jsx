import { Link } from "react-router-dom";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
export default function Dashboard() {
  const state = useApiData("/admin/analytics", null);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader title="System Overview">
        <Link className="btn-primary" to="/admin/users">
          Quản lý tài khoản
        </Link>
      </AdminHeader>
      <ApiFeedback state={state} />
      {state.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries({
              "Tài khoản": state.data.counts.users,
              "Lớp học": state.data.counts.classrooms,
              "Lượt đăng ký lớp": state.data.counts.enrollments,
              "Bộ thử thách": state.data.counts.assignments,
              "Bộ trắc nghiệm": state.data.counts.quizzes,
              "Tài liệu": state.data.counts.materials,
              "Bài học": state.data.counts.algorithms,
            }).map(([label, value]) => (
              <div key={label} className="panel p-6">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <section className="panel p-6">
            <h2 className="mb-3 font-bold">Kết nối dữ liệu</h2>
            <p className="text-sm leading-6 text-slate-500">
              Số liệu được lấy từ database. Kết quả quiz và tiến độ game được lưu chung trên server. Mức thành thạo từ mô hình Knowledge Tracing chưa có dữ liệu.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
