import { useText } from "../preferences/preferencesContext";
import { useAuth } from "../auth/useAuth";
import { Outlet } from "react-router-dom";
import {
  GraduationCap,
  ClipboardList,
  ListChecks,
  TrendingUp,
  BarChart2,
  Download,
} from "lucide-react";
import { useClassrooms } from "../features/instructor/workspace/ClassroomContext";
import PortalFrame from "./PortalFrame";
import "./InstructorLayout.css";

const InstructorLayout = () => {
  const text = useText();
  const { user, logout } = useAuth();
  const stateLoadError = useClassrooms()?.stateLoadError;
  const navItems = [
    {
      path: "/instructor/classes",
      name: text("Lớp của tôi"), group: text("Giảng dạy"),
      icon: <GraduationCap size={20} />,
    },
    {
      path: "/instructor/challenges",
      name: text("Bộ thử thách"), group: text("Giảng dạy"),
      icon: <ClipboardList size={20} />,
    },
    {
      path: "/instructor/quizzes",
      name: text("Trắc nghiệm"), group: text("Giảng dạy"),
      icon: <ListChecks size={20} />,
    },
    {
      path: "/instructor/progress",
      name: text("Tiến độ học tập"), group: text("Theo dõi & báo cáo"),
      icon: <TrendingUp size={20} />,
    },
    {
      path: "/instructor/analytics",
      name: text("Phân tích lớp học"), group: text("Theo dõi & báo cáo"),
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/instructor/export",
      name: text("Xuất kết quả"), group: text("Theo dõi & báo cáo"),
      icon: <Download size={20} />,
    },
  ];

  return (
    <PortalFrame user={user} logout={logout} navItems={navItems} className="instructor-shell">
      {stateLoadError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{stateLoadError}</p>}
      <Outlet />
    </PortalFrame>
  );
};

export default InstructorLayout;
