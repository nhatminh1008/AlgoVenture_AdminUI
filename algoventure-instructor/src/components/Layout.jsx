import { NavLink, Outlet } from "react-router-dom";
import {
  GraduationCap,
  TrendingUp,
  BarChart2,
  Download,
  BookOpen,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";

export default function Layout() {
  const { session, storageError, notices } = useClassrooms();
  const nav = [
    ["/classes", "Lớp học", GraduationCap],
    ["/progress", "Tiến độ", TrendingUp],
    ["/analytics", "Phân tích", BarChart2],
    ["/export", "Xuất kết quả", Download],
  ];
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar text-slate-300">
        <div className="flex items-center gap-3 p-6">
          <span className="rounded-lg bg-brand p-2 text-white">
            <BookOpen size={22} />
          </span>
          <div>
            <p className="text-lg font-bold text-white">AlgoVenture</p>
            <p className="text-[10px] font-semibold tracking-widest text-brand">
              INSTRUCTOR PORTAL
            </p>
          </div>
        </div>
        <nav
          aria-label="Điều hướng chính"
          className="mt-4 flex-1 space-y-2 px-4"
        >
          {nav.map(([path, title, Icon]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${isActive ? "border-brand bg-slate-800 text-brand" : "border-transparent hover:bg-slate-800 hover:text-white"}`
              }
            >
              <Icon size={19} />
              {title}
            </NavLink>
          ))}
        </nav>
        <div className="m-4 border-t border-slate-700 p-4">
          <p className="text-sm font-semibold text-white">{session.name}</p>
          <p className="mt-1 text-xs text-slate-400">
            Giảng viên · phiên giả lập
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="no-print flex flex-wrap justify-between gap-2 border-b border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:px-8">
          <span>AlgoVenture / Không gian giảng viên</span>
          <span>Lưu cục bộ · Chưa kết nối API</span>
        </header>
        <main className="p-5 sm:p-8 lg:p-10">
          {storageError && (
            <p
              role="alert"
              className="no-print mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {storageError}
            </p>
          )}
          {notices.length > 0 && (
            <details className="no-print mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              <summary className="cursor-pointer font-semibold">
                Thông báo dữ liệu ({notices.length})
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </details>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
