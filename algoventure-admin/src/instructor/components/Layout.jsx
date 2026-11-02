import { useAuth } from "../../auth/AuthContext";
import { NavLink, Outlet } from "react-router-dom";
import {
  LogOut,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Download,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import BrandMark from "../../components/BrandMark";
import "./instructor.css";

const Layout = () => {
  const { user, logout } = useAuth();
  const { storageError } = useClassrooms();
  const navItems = [
    {
      path: "/instructor/classes",
      name: "Lớp của tôi",
      icon: <GraduationCap size={20} />,
    },
    {
      path: "/instructor/challenges",
      name: "Bộ thử thách",
      icon: <ClipboardList size={20} />,
    },
    {
      path: "/instructor/progress",
      name: "Tiến độ học tập",
      icon: <TrendingUp size={20} />,
    },
    {
      path: "/instructor/analytics",
      name: "Phân tích lớp học",
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/instructor/export",
      name: "Xuất kết quả",
      icon: <Download size={20} />,
    },
  ];

  return (
    <div className="portal-shell instructor-shell">
      {/* Sidebar */}
      <aside className="portal-sidebar text-slate-300">
        <div className="instructor-brand">
          <BrandMark className="instructor-brand-mark" />
          <div>
            <p className="instructor-brand-name">
              AlgoVenture
            </p>
            <p className="instructor-brand-role">
              GIẢNG VIÊN
            </p>
          </div>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className="instructor-nav"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `instructor-nav-link${isActive ? " is-active" : ""}`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="instructor-profile">
          <div className="flex items-center gap-3">
            <span className="instructor-avatar">
              {user.name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("")}
            </span>
            <div className="min-w-0">
              <p className="instructor-profile-name">{user.name}</p>
              <p className="instructor-profile-role">Giảng viên</p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
        <button onClick={logout} className="mobile-logout">
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <main id="main-content" className="instructor-main">
          {storageError && (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {storageError}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
