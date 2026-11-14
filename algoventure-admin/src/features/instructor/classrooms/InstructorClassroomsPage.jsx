import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, GraduationCap, ArrowUpRight, ArrowRight, TrendingUp, Send, X, Users, BookOpen, LayoutGrid, List, SlidersHorizontal, Network, Layers3, ChartNoAxesColumnIncreasing } from "lucide-react";
import { useClassrooms } from "../workspace/ClassroomContext";
import { levels, getLevel } from "../../../shared/curriculum/curriculumCatalog";
import { WorkspaceStats } from "../../../shared/components/WorkspaceStats";
import { PageHeader } from "../workspace/PageHeader";

const topicIcons = {
  sorting: ChartNoAxesColumnIncreasing,
  searching: Search,
  "data-structures": Layers3,
  graphs: Network,
};

export default function InstructorClassroomsPage() {
  const text = useText();
  const { classes, students, assignments, quizzes, topics, getTopic } = useClassrooms();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");
  const [view, setView] = useState("grid");
  const filtered = classes.filter((item) =>
    (topic === "all" || item.topicId === topic) &&
    (level === "all" || item.level === level) &&
    `${item.name} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const classIds = new Set(classes.map((item) => item.id));
  const hasFilters = query || topic !== "all" || level !== "all";
  function clearFilters() { setQuery(""); setTopic("all"); setLevel("all"); }
  function classCounts(id) { return { members: students.filter((student) => student.classId === id).length, sets: [...assignments, ...quizzes].filter((set) => set.classId === id).length }; }

  const pagination = usePagination(filtered, query + topic + level);
  return (
    <div className="classes-page">
      <PageHeader title={text("Lớp của tôi")}><Link to="/instructor/classes/new" className="btn-primary"><Plus size={17} />{text("Tạo lớp mới")}</Link></PageHeader>
      <WorkspaceStats items={[
        { label: text("Lớp học"), value: classes.length, icon: <GraduationCap /> },
        { label: text("Sinh viên"), value: students.filter((student) => classIds.has(student.classId)).length, icon: <Users />, to: "/instructor/progress" },
        { label: text("Bộ bài đã tạo"), value: [...assignments, ...quizzes].filter((set) => classIds.has(set.classId)).length, icon: <BookOpen />, to: "/instructor/challenges" },
      ]} />
      <section aria-label={text("Danh sách lớp học")} className="classes-directory">
        <div className="classes-section-heading"><h2>{text("Danh sách lớp ")} <span>{classes.length}</span></h2><div className="classes-view-toggle" role="group" aria-label={text("Chế độ hiển thị")}><button aria-label={text("Dạng thẻ")} aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={16} /></button><button aria-label={text("Dạng danh sách")} aria-pressed={view === "list"} onClick={() => setView("list")}><List size={17} /></button></div></div>
        <div className="classes-toolbar">
          <label className="classes-search"><span className="sr-only">{text("Tìm lớp học")}</span><Search size={17} aria-hidden="true" /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Tìm tên lớp hoặc mô tả…")} />{query && <button type="button" aria-label={text("Xóa tìm kiếm")} onClick={() => setQuery("")}><X size={15} /></button>}</label>
          <span className="classes-filter-icon" aria-hidden="true"><SlidersHorizontal size={16} /></span>
          <select aria-label={text("Lọc theo chủ đề")} className="field classes-filter" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">{text("Tất cả chủ đề")}</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          <select aria-label={text("Lọc theo mức độ")} className="field classes-filter" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">{text("Tất cả mức độ")}</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        </div>
        <div className="classes-filter-summary"><span role="status">{text("Hiển thị ")} {filtered.length} {text(" lớp học")}{hasFilters ? text(" phù hợp") : ""}</span>{hasFilters && <button onClick={clearFilters}>{text("Xóa bộ lọc")}<X size={12} /></button>}</div>
        {filtered.length > 0 ? view === "grid" ? <div className="class-card-grid">{pagination.items.map((item) => {
          const { members, sets } = classCounts(item.id);
          const classTopic = getTopic(item.topicId);
          const TopicIcon = topicIcons[classTopic?.id] ?? GraduationCap;
          return <article className="class-card" data-topic={classTopic?.id} key={item.id}>
            <div className="class-card-cover">
              <TopicIcon className="class-cover-pattern" aria-hidden="true" />
              <span className="class-card-symbol" aria-hidden="true"><TopicIcon /></span>
              <span className="class-topic-label">{classTopic?.label ?? item.topicId}</span>
              <span className="class-level class-card-level" data-level={item.level}>{getLevel(item.level)?.label ?? item.level}</span>
            </div>
            <div className="class-card-body"><h3><Link to={`/instructor/classes/${item.id}`}>{item.name}</Link></h3><p>{item.description || classTopic?.description}</p><div className="class-card-meta">{item.archivedAt && <span className="instructor-badge instructor-badge-closed">{text("Đã lưu trữ")}</span>}<span><Users size={16} />{members} {text(" sinh viên")}</span><span><BookOpen size={16} />{sets} {text(" bộ bài")}</span></div></div>
            <div className="class-card-actions"><Link className="class-card-open" to={`/instructor/classes/${item.id}`}>{text("Vào lớp học")}<ArrowRight size={14} /></Link>{!item.archivedAt && <Link className="class-row-icon" to={`/instructor/challenges/new?classId=${item.id}`} aria-label={`Giao thử thách cho ${item.name}`} title={text("Giao bài")}><Send size={16} /></Link>}<Link className="class-row-icon" to={`/instructor/progress?classId=${item.id}`} aria-label={`Xem tiến độ ${item.name}`} title={text("Xem tiến độ")}><TrendingUp size={17} /></Link></div>
          </article>;
        })}<Link to="/instructor/classes/new" className="class-create-card"><span><Plus size={23} /></span><strong>{text("Tạo lớp mới")}</strong></Link></div> : (
          <div className="classes-table-wrap"><table className="classes-table">
            <thead><tr><th>{text("Lớp học")}</th><th>{text("Chủ đề")}</th><th>{text("Mức độ")}</th><th>{text("Sinh viên")}</th><th>{text("Bộ bài")}</th><th><span className="sr-only">{text("Thao tác")}</span></th></tr></thead>
            <tbody>{pagination.items.map((item) => {
              const { members, sets } = classCounts(item.id);
              const classTopic = getTopic(item.topicId);
              const TopicIcon = topicIcons[classTopic?.id] ?? GraduationCap;
              return (
                <tr key={item.id} data-topic={classTopic?.id}>
                  <td className="class-name-cell">
                    <Link to={`/instructor/classes/${item.id}`}>
                      <span className="class-list-icon" aria-hidden="true"><TopicIcon size={20} /></span>
                      <span>{item.name}{item.archivedAt && <small className="block text-slate-500">{text("Đã lưu trữ")}</small>}</span>
                    </Link>
                  </td>
                  <td data-label="Chủ đề">{classTopic?.label ?? item.topicId}</td>
                  <td data-label="Mức độ"><span className="class-level" data-level={item.level}>{getLevel(item.level)?.label ?? item.level}</span></td>
                  <td data-label="Sinh viên">{members}</td>
                  <td data-label="Bộ bài">{sets}</td>
                  <td className="class-actions-cell"><div>{!item.archivedAt && <Link className="class-assign" to={`/instructor/challenges/new?classId=${item.id}`} aria-label={`Giao thử thách cho ${item.name}`}><Send size={14} />{text("Giao bài")}</Link>}<Link className="class-row-icon" to={`/instructor/progress?classId=${item.id}`} aria-label={`Xem tiến độ ${item.name}`} title={text("Xem tiến độ")}><TrendingUp size={17} /></Link><Link className="class-row-icon" to={`/instructor/classes/${item.id}`} aria-label={`Mở lớp ${item.name}`} title={text("Mở lớp")}><ArrowUpRight size={18} /></Link></div></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <div className="instructor-empty panel"><span className="empty-icon"><GraduationCap size={30} /></span><h2>{classes.length ? text("Không tìm thấy lớp phù hợp") : text("Chưa có lớp học")}</h2><p>{classes.length ? text("Thay đổi từ khóa hoặc xóa bộ lọc.") : text("Tạo lớp để thêm sinh viên và giao bài tập.")}</p>{classes.length ? <button className="btn-secondary" onClick={clearFilters}>{text("Xóa bộ lọc")}</button> : <Link className="btn-primary" to="/instructor/classes/new"><Plus size={16} />{text("Tạo lớp mới")}</Link>}</div>}
        <Pagination pagination={pagination} />
      </section>
    </div>
  );
}
