import { useAuth } from "../../auth/AuthContext";
import { Outlet } from "react-router-dom";
import {
  GraduationCap,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Download,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import PortalFrame from "../../components/PortalFrame";
import "./instructor.css";

const Layout = () => {
  const { user, logout } = useAuth();
  const { storageError } = useClassrooms();
  const navItems = [
    {
      path: "/instructor/classes",
      name: "Lớp của tôi", group: "Giảng dạy",
      icon: <GraduationCap size={20} />,
    },
    {
      path: "/instructor/challenges",
      name: "Bộ thử thách", group: "Giảng dạy",
      icon: <ClipboardList size={20} />,
    },
    {
      path: "/instructor/progress",
      name: "Tiến độ học tập", group: "Theo dõi & báo cáo",
      icon: <TrendingUp size={20} />,
    },
    {
      path: "/instructor/analytics",
      name: "Phân tích lớp học", group: "Theo dõi & báo cáo",
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/instructor/export",
      name: "Xuất kết quả", group: "Theo dõi & báo cáo",
      icon: <Download size={20} />,
    },
  ];

  return (
    <PortalFrame user={user} logout={logout} navItems={navItems} className="instructor-shell">
      {storageError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{storageError}</p>}
      <Outlet />
    </PortalFrame>
  );
};

export default Layout;
