import { useText } from "../preferences/preferencesContext";
import { useAuth } from "../auth/useAuth";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  GraduationCap,
  ClipboardList,
  ListChecks,
  TrendingUp,
  BarChart2,
  Download,
} from "lucide-react";
import { ClassroomProvider } from "../features/instructor/workspace/ClassroomContext";
import { useClassrooms } from "../features/instructor/workspace/useClassrooms";
import { instructorActivePath } from "../features/instructor/workspace/useInstructorNavigation";
import { InstructorNoticeContext } from "../features/instructor/workspace/InstructorNoticeContext";
import { useInstructorScroll } from "../features/instructor/workspace/useInstructorScroll";
import PortalFrame from "./PortalFrame";
import "./InstructorLayout.css";

const InstructorLayout = () => {
  const text = useText();
  const { user, logout } = useAuth();
  const { pathname, search, key, state } = useLocation();
  const [notice, setNotice] = useState(null);
  const message = notice?.key === key ? notice.message : state?.message;
  const activePath = instructorActivePath(pathname, search);
  useInstructorScroll();
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
    <PortalFrame user={user} logout={logout} navItems={navItems} activePath={activePath}
      pageTitle={activePath ? undefined : text("Trang không tồn tại", "Page not found")} className="instructor-shell">
      {message && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{message}</p>}
      <InstructorNoticeContext.Provider value={(key, message) => setNotice({ key, message })}>
        <ClassroomProvider>
          <InstructorContent />
        </ClassroomProvider>
      </InstructorNoticeContext.Provider>
    </PortalFrame>
  );
};

function InstructorContent() {
  const text = useText();
  const { stateLoadError } = useClassrooms();
  return <>
    {stateLoadError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text(stateLoadError)}</p>}
    <Outlet />
  </>;
}

export default InstructorLayout;
