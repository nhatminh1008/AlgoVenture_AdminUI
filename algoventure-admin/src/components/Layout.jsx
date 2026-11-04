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
    <PortalFrame user={user} logout={logout} navItems={navItems} roleLabel="Quản trị viên" className="admin-shell">
      <Outlet />
    </PortalFrame>
  );
};

export default Layout;
