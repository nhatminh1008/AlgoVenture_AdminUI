import { useText } from "../preferences/preferencesContext";
import { useAuth } from "../auth/useAuth";
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

const AdminLayout = () => {
  const text = useText();
  const { user, logout } = useAuth();
  const navItems = [
    { path: "/admin", name: text("Tổng quan"), group: text("Quản lý"), icon: <LayoutDashboard size={20} /> },
    {
      path: "/admin/users",
      name: text("Tài khoản"), group: text("Quản lý"),
      icon: <Users size={20} />,
    },
    {
      path: "/admin/classes",
      name: text("Lớp học"), group: text("Quản lý"),
      icon: <Users size={20} />,
    },
    {
      path: "/admin/content",
      name: text("Thư viện bài học"), group: text("Nội dung học tập"),
      icon: <BookOpen size={20} />,
    },
    {
      path: "/admin/levels",
      name: text("Cấu hình bài học"), group: text("Nội dung học tập"),
      icon: <Sliders size={20} />,
    },
    {
      path: "/admin/analytics",
      name: text("Phân tích hệ thống"), group: text("Hệ thống"),
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/admin/features",
      name: text("Tính năng"), group: text("Hệ thống"),
      icon: <ToggleLeft size={20} />,
    },
    { path: "/admin/settings", name: text("Cài đặt"), group: text("Hệ thống"), icon: <Settings size={20} /> },
  ];

  return (
    <PortalFrame user={user} logout={logout} navItems={navItems} className="admin-shell">
      <Outlet />
    </PortalFrame>
  );
};

export default AdminLayout;
