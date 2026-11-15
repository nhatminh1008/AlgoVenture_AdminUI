import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
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
  function classCounts(id) { return { members: students.filter((student) => student.classId === id).length, sets: [...assignments, ...quizzes].filter((set) => set.classId === id).length }; }

  const pagination = usePagination(filtered, query + level);
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
            <div className="overflow-x-auto">
              <table className="data-table" aria-labelledby="class-directory-heading">
                <thead>
                  <tr>
                    <th scope="col">{text("Lớp học")}</th>
                    <th scope="col">{text("Mức độ")}</th>
                    <th scope="col">{text("Sinh viên")}</th>
                    <th scope="col">{text("Bộ bài")}</th>
                    <th scope="col"><span className="sr-only">{text("Thao tác")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((item) => {
                    const { members, sets } = classCounts(item.id);
                    const classUrl = `/instructor/classes/${item.id}`;
                    return (
                      <tr key={item.id}>
                        <td className="min-w-40">
                          <Link className="wrap-anywhere hover:underline" to={classUrl}>{item.name}</Link>
                          {item.archivedAt && (
                            <div className="mt-1"><span className="instructor-badge instructor-badge-closed">{text("Đã lưu trữ")}</span></div>
                          )}
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-slate-500 wrap-anywhere">{item.description}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap"><span className="class-level" data-level={item.level}>{getLevel(item.level)?.label ?? item.level}</span></td>
                        <td>{members}</td>
                        <td>{sets}</td>
                        <td>
                          <Link className="btn-row-action whitespace-nowrap" to={classUrl} aria-label={`${text("Vào lớp", "Open class")}: ${item.name}`}>
                            {text("Vào lớp", "Open class")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} />
          </div>
        ) : <div className="instructor-empty panel"><span className="empty-icon"><GraduationCap size={30} /></span><h2>{classes.length ? text("Không tìm thấy lớp phù hợp") : text("Chưa có lớp học")}</h2><p>{classes.length ? text("Thay đổi từ khóa hoặc xóa bộ lọc.") : text("Tạo lớp để thêm sinh viên và giao bài tập.")}</p>{classes.length ? <button className="btn-secondary" onClick={clearFilters}>{text("Xóa bộ lọc")}</button> : <Link className="btn-primary" to="/instructor/classes/new"><Plus size={16} />{text("Tạo lớp mới")}</Link>}</div>}
      </section>
    </div>
  );
}
