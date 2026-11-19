import { useLocale, useText } from "../../../preferences/preferencesContext";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, ClipboardList, GraduationCap, Library, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import { actionLabel } from "../recordLabels.js";
import { getAdminAnalytics } from "../analytics/adminAnalyticsService";

export default function AdminDashboardPage() {
  const locale = useLocale();
  const text = useText();
  const state = useApiDataWithErrorToast(getAdminAnalytics, null);
  const counts = state.data?.counts;
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title={text("Tổng quan hệ thống")}>
        <Link className="btn-primary" to="/admin/users"><UserPlus size={16} />{text("Quản lý tài khoản")}</Link>
      </AdminPageHeader>
      <div className="mt-5"><ApiFeedback state={state} /></div>
      {counts && <>
        <WorkspaceStats items={[
          { label: text("Tổng tài khoản"), value: counts.users, icon: <Users />, tone: "mint", to: "/admin/users" },
          { label: text("Lớp học"), value: counts.classrooms, icon: <GraduationCap />, tone: "peach", to: "/admin/classes" },
          { label: text("Lượt đăng ký lớp"), value: counts.enrollments, icon: <UserPlus />, tone: "lilac", to: "/admin/classes" },
        ]} />
        <div className="dashboard-columns">
          <section className="panel dashboard-section"><div className="dashboard-section-heading"><h2>{text("Nội dung học tập")}</h2><Link to="/admin/content">{text("Xem thư viện")}<ArrowUpRight size={14} /></Link></div><div className="resource-grid">
            {[["Bài học thuật toán", counts.algorithms, BookOpen], ["Bộ thử thách", counts.assignments, ClipboardList], ["Bộ trắc nghiệm", counts.quizzes, Library]].map(([label, value, Icon]) => <div className="resource-tile" key={label}><div><Icon /><strong>{value.toLocaleString(locale)}</strong></div><span>{text(label)}</span></div>)}
          </div></section>
          <section className="panel dashboard-section"><div className="dashboard-section-heading"><h2>{text("Truy cập nhanh")}</h2></div><div className="quick-actions">
            {[
              { to: "/admin/users", icon: <ShieldCheck />, title: text("Quản lý tài khoản"), note: text("Xem hồ sơ và khóa tài khoản"), tone: "mint" },
              { to: "/admin/classes", icon: <GraduationCap />, title: text("Quản lý lớp học"), note: text("Xem lớp và thành viên, khóa hoặc mở khóa lớp"), tone: "peach" },
              { to: "/admin/content", icon: <BookOpen />, title: text("Thư viện bài học"), note: text("Tìm và cấu hình từng bài học", "Find and configure individual lessons"), tone: "lilac" },
            ].map((item) => <Link className="quick-action" to={item.to} key={item.to}><span className={`tone-${item.tone}`}>{item.icon}</span><div><strong>{item.title}</strong><small>{item.note}</small></div><ArrowUpRight /></Link>)}
          </div></section>
        </div>
        <section className="panel dashboard-activity"><div className="dashboard-section-heading"><h2>{text("Hoạt động gần đây")}</h2><Link to="/admin/analytics">{text("Xem tất cả")}<ArrowUpRight size={14} /></Link></div>
          {state.data.logs.length ? <div className="activity-list">{state.data.logs.slice(0, 4).map((row, i) => <div className="activity-row" key={i}><span className="activity-dot" /><div><strong>{text(actionLabel(row.action))}</strong><small>{row.actor}</small></div><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString(locale)}</time></div>)}</div> : <p className="dashboard-empty">{text("Chưa có hoạt động.")}</p>}
        </section>
      </>}
    </div>
  );
}
