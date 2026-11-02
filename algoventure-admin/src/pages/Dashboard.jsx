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
          <dl className="admin-summary">
            {Object.entries({
              "Tài khoản": state.data.counts.users,
              "Lớp học": state.data.counts.classrooms,
              "Lượt đăng ký lớp": state.data.counts.enrollments,
            }).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt><dd>{value}</dd>
              </div>
            ))}
          </dl>
          <section className="admin-resource-section">
            <h2>Nội dung học tập</h2>
            <dl className="admin-resources">{Object.entries({
              "Bộ thử thách": state.data.counts.assignments,
              "Bộ trắc nghiệm": state.data.counts.quizzes,
              "Tài liệu": state.data.counts.materials,
              "Bài học": state.data.counts.algorithms,
            }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </section>
        </>
      )}
    </div>
  );
}
