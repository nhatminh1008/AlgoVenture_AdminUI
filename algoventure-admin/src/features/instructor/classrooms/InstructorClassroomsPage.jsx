import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, GraduationCap, X, Users, BookOpen, SlidersHorizontal } from "lucide-react";
import { useClassrooms } from "../workspace/ClassroomContext";
import { levels, getLevel } from "../../../shared/curriculum/curriculumCatalog";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import { PageHeader } from "../workspace/PageHeader";

export default function InstructorClassroomsPage() {
  const text = useText();
  const { classes, students, assignments, quizzes } = useClassrooms();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const filtered = classes.filter((item) =>
    (level === "all" || item.level === level) &&
    `${item.name} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const classIds = new Set(classes.map((item) => item.id));
  const hasFilters = query || level !== "all";
  function clearFilters() { setQuery(""); setLevel("all"); }
  const pagination = usePagination(filtered, query + level);
  const columns = [
    {
      key: "name", title: text("Lớp học"), layout: "primary",
      render: (item) => <>
        <Link className="wrap-anywhere hover:underline" to={`/instructor/classes/${item.id}`}>{item.name}</Link>
        {item.archivedAt && (
          <div className="mt-1"><span className="instructor-badge instructor-badge-closed">{text("Đã lưu trữ")}</span></div>
        )}
        {item.description && <p className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-slate-500 wrap-anywhere">{item.description}</p>}
      </>,
    },
    {
      key: "level", title: text("Mức độ"),
      render: (item) => <span className="class-level" data-level={item.level}>{getLevel(item.level)?.label ?? item.level}</span>,
    },
    { key: "members", title: text("Sinh viên"), render: (item) => students.filter((student) => student.classId === item.id).length },
    { key: "sets", title: text("Bộ bài"), render: (item) => [...assignments, ...quizzes].filter((set) => set.classId === item.id).length },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (item) => (
        <Link className="btn-row-action" to={`/instructor/classes/${item.id}`}
          aria-label={`${text("Vào lớp", "Open class")}: ${item.name}`}>
          {text("Vào lớp", "Open class")}
        </Link>
      ),
    },
  ];
  return (
    <div className="classes-page">
      <PageHeader title={text("Lớp của tôi")}><Link to="/instructor/classes/new" className="btn-primary"><Plus size={17} />{text("Tạo lớp mới")}</Link></PageHeader>
      <WorkspaceStats items={[
        { label: text("Lớp học"), value: classes.length, icon: <GraduationCap /> },
        { label: text("Sinh viên"), value: students.filter((student) => classIds.has(student.classId)).length, icon: <Users />, to: "/instructor/progress" },
        { label: text("Bộ bài đã tạo"), value: [...assignments, ...quizzes].filter((set) => classIds.has(set.classId)).length, icon: <BookOpen />, to: "/instructor/challenges" },
      ]} />
      <section className="classes-directory" aria-labelledby="class-directory-heading">
        <div className="classes-section-heading">
          <h2 id="class-directory-heading">{text("Danh sách lớp ")} <span>{classes.length}</span></h2>
        </div>
        <div className="classes-toolbar">
          <label className="classes-search"><span className="sr-only">{text("Tìm lớp học")}</span><Search size={17} aria-hidden="true" /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Tìm tên lớp hoặc mô tả…")} />{query && <button type="button" aria-label={text("Xóa tìm kiếm")} onClick={() => setQuery("")}><X size={15} /></button>}</label>
          <span className="classes-filter-icon" aria-hidden="true"><SlidersHorizontal size={16} /></span>
          <select aria-label={text("Lọc theo mức độ")} className="field classes-filter" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">{text("Tất cả mức độ")}</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        </div>
        <div className="classes-filter-summary"><span role="status">{text("Hiển thị ")} {filtered.length} {text(" lớp học")}{hasFilters ? text(" phù hợp") : ""}</span>{hasFilters && <button onClick={clearFilters}>{text("Xóa bộ lọc")}<X size={12} /></button>}</div>
        {filtered.length > 0 ? (
          <div className="panel overflow-hidden">
            <RecordTable label={text("Danh sách lớp học", "Class directory")} columns={columns} rows={pagination.items} />
            <Pagination pagination={pagination} />
          </div>
        ) : <div className="instructor-empty panel"><span className="empty-icon"><GraduationCap size={30} /></span><h2>{classes.length ? text("Không tìm thấy lớp phù hợp") : text("Chưa có lớp học")}</h2><p>{classes.length ? text("Thay đổi từ khóa hoặc xóa bộ lọc.") : text("Tạo lớp để thêm sinh viên và giao bài tập.")}</p>{classes.length ? <button className="btn-secondary" onClick={clearFilters}>{text("Xóa bộ lọc")}</button> : <Link className="btn-primary" to="/instructor/classes/new"><Plus size={16} />{text("Tạo lớp mới")}</Link>}</div>}
      </section>
    </div>
  );
}
