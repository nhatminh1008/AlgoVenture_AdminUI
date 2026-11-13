import { Navigate, Outlet, useLocation } from "react-router-dom";
import { roleHome } from "./authRoutes";
import { useAuth } from "./useAuth";

export function RequireRole({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!["admin", "instructor"].includes(user.role)) return <LearnerNotice />;
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}
function LearnerNotice() {
  const { logout } = useAuth();
  return (
    <div className="p-8">
      <p>
        Tài khoản Learner sử dụng ứng dụng học tập. Web này dành cho Admin và
        Instructor.
      </p>
      <button className="btn-secondary mt-4" onClick={logout}>
        Đăng xuất
      </button>
    </div>
  );
}
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}
