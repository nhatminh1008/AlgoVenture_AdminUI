import { useAuth } from "../../auth/AuthContext";
import { NavLink, Outlet } from "react-router-dom";
import {
  LogOut,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Download,
  BookOpen,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";

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
    <div className="portal-shell">
      {/* Sidebar */}
      <aside className="portal-sidebar text-slate-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">
              AlgoVenture
            </p>
            <p className="text-brand text-xs font-semibold tracking-wider">
              INSTRUCTOR PORTAL
            </p>
          </div>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className="flex-1 px-4 space-y-2 mt-4"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-slate-800 text-brand border-l-4 border-brand"
                    : "hover:bg-slate-800 hover:text-white border-l-4 border-transparent"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700 m-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-slate-700 grid place-items-center text-white text-sm">
              ER
            </span>
            <div>
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-xs text-slate-400">Giảng viên</p>
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
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:px-8">
          <span>AlgoVenture / Không gian giảng viên</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Đã kết nối Spring Boot API
          </span>
        </header>
        <main id="main-content" className="p-5 sm:p-8 lg:p-10">
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
