import { useAuth } from "../auth/AuthContext";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Sliders,
  BarChart2,
  ToggleLeft,
  Settings,
  LogOut,
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const navItems = [
    { path: "/admin", name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    {
      path: "/admin/users",
      name: "User Management",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/classes",
      name: "Classroom Management",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/content",
      name: "Content & Levels",
      icon: <BookOpen size={20} />,
    },
    {
      path: "/admin/levels",
      name: "Level Config",
      icon: <Sliders size={20} />,
    },
    {
      path: "/admin/analytics",
      name: "System Analytics",
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/admin/features",
      name: "Feature Toggles",
      icon: <ToggleLeft size={20} />,
    },
    { path: "/admin/settings", name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="portal-shell font-sans">
      {/* Sidebar */}
      <aside className="portal-sidebar text-slate-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">∴</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              AlgoVenture
            </h1>
            <p className="text-brand text-xs font-semibold tracking-wider">
              ADMIN CONSOLE
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
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
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-xs text-slate-400">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="text-slate-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
        <button onClick={logout} className="mobile-logout">
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
