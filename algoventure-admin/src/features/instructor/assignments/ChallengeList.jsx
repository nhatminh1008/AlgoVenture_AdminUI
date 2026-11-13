import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, BookOpen, ClipboardList, FilePenLine, Send } from "lucide-react";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";
import { PageHeader } from "../workspace/PageHeader";
import { useClassrooms } from "../workspace/ClassroomContext";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";

const statusLabels = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};

export default function ChallengeList() {
  const { lessonName } = useClassrooms();
  const scope = useClassroomScope();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const classNames = new Map(scope.classes.map(item => [item.id, item.name]));
  const archivedClassIds = new Set(scope.classes.filter((item) => item.archivedAt).map((item) => item.id));
  const sets = scope.sets.filter(item => (!status || (!item.archivedAt && item.status === status)) &&
    `${item.title} ${classNames.get(item.classId) ?? ""}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const createUrl = `/instructor/challenges/new${scope.classroom && !scope.classroom.archivedAt ? `?classId=${encodeURIComponent(scope.classroom.id)}` : ""}`;
  return <div className="mx-auto max-w-6xl">
    <PageHeader title="Bộ thử thách"><Link to={createUrl} className="btn-primary"><Plus size={17} />Tạo bộ thử thách</Link></PageHeader>
    {location.state?.message && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{location.state.message}</p>}
    <WorkspaceStats items={[
      { label: "Tổng bộ thử thách", value: scope.sets.length, icon: <ClipboardList /> },
      { label: "Đang giao", value: scope.sets.filter(item => !item.archivedAt && !archivedClassIds.has(item.classId) && item.status === "Active").length, icon: <Send /> },
      { label: "Bản nháp", value: scope.sets.filter(item => item.status === "Draft").length, icon: <FilePenLine /> },
    ]} />
    <section className="panel overflow-hidden" aria-label="Danh sách bộ thử thách">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-5">
        <ClassroomFilter scope={scope} />
        <label className="min-w-0 flex-1"><span className="sr-only">Tìm bộ thử thách</span><input className="field" type="search" placeholder="Tìm theo tên bộ bài hoặc lớp…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label><span className="sr-only">Lọc theo trạng thái</span><select className="field" value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {scope.invalid && <p role="alert" className="p-5 text-sm text-amber-800">Lớp không tồn tại trong danh sách bạn phụ trách. Hãy chọn một lớp khác.</p>}
      <div className="relative overflow-x-auto"><table className="data-table">
        <thead><tr><th>Tên bộ thử thách</th><th>Lớp nhận bài</th><th>Nội dung</th><th>Hạn hoàn thành</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{sets.map(item => {
          const canEdit = !item.archivedAt && !archivedClassIds.has(item.classId) && item.status === "Draft";
          return <tr key={item.id}>
            <td className="font-semibold text-slate-900">{item.title}</td><td>{classNames.get(item.classId) ?? "Lớp không khả dụng"}</td>
            <td className="max-w-64 text-xs leading-5 text-slate-500">{item.lessonIds.map(lessonName).join(", ")}</td>
            <td className="whitespace-nowrap">{item.due || "Chưa đặt"}</td>
            <td><span className={`instructor-badge ${item.archivedAt || item.status === "Closed" ? "instructor-badge-closed" : item.status === "Draft" ? "instructor-badge-draft" : ""}`}>{item.archivedAt ? "Đã lưu trữ" : statusLabels[item.status]}</span></td>
            <td><Link className="whitespace-nowrap font-semibold text-portal-purple-strong" aria-label={`${canEdit ? "Chỉnh sửa" : "Xem"}: ${item.title}`} to={`/instructor/challenges?assignmentId=${encodeURIComponent(item.id)}`}>{canEdit ? "Chỉnh sửa" : "Xem chi tiết"}</Link></td>
          </tr>;
        })}</tbody>
      </table></div>
      {!sets.length && <div className="p-10 text-center"><BookOpen size={32} className="mx-auto mb-3 text-slate-300" /><h2 className="font-semibold">{scope.sets.length || query || status || scope.invalid ? "Không tìm thấy bộ thử thách phù hợp" : "Chưa có bộ thử thách"}</h2><p className="mt-2 text-sm text-slate-500">{scope.sets.length || query || status || scope.invalid ? "Thử thay đổi lớp, trạng thái hoặc từ khóa tìm kiếm." : "Tạo bộ thử thách mới và chọn lớp nhận bài để bắt đầu."}</p>{!scope.invalid && <Link className="btn-primary mt-5" to={createUrl}><Plus size={16} />Tạo bộ thử thách</Link>}</div>}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Hiển thị {sets.length} / {scope.sets.length} bộ thử thách</p>
    </section>
  </div>;
}
