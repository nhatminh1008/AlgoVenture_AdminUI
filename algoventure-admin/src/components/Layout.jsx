import { useAuth } from "../auth/AuthContext";
import { Outlet } from "react-router-dom";
import PortalFrame from "./PortalFrame";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Sliders,
  BarChart2,
  ToggleLeft,
  Settings,
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const navItems = [
    { path: "/admin", name: "Tổng quan", group: "Quản lý", icon: <LayoutDashboard size={20} /> },
    {
      path: "/admin/users",
      name: "Tài khoản", group: "Quản lý",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/classes",
      name: "Lớp học", group: "Quản lý",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/content",
      name: "Thư viện bài học", group: "Nội dung học tập",
      icon: <BookOpen size={20} />,
    },
    {
      path: "/admin/levels",
      name: "Cấu hình bài học", group: "Nội dung học tập",
      icon: <Sliders size={20} />,
    },
    {
      path: "/admin/analytics",
      name: "Phân tích hệ thống", group: "Hệ thống",
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/admin/features",
      name: "Tính năng", group: "Hệ thống",
      icon: <ToggleLeft size={20} />,
    },
    { path: "/admin/settings", name: "Cài đặt", group: "Hệ thống", icon: <Settings size={20} /> },
  ];

  return (
    <PortalFrame user={user} logout={logout} navItems={navItems} className="admin-shell">
      <Outlet />
    </PortalFrame>
  );
};

export default Layout;
