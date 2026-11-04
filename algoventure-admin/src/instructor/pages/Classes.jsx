import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, GraduationCap, ArrowUpRight, TrendingUp, Send, X } from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import { topics, levels, getTopic, getLevel } from "../data/curriculum";

export default function Classes() {
  const { classes, students, assignments, quizzes } = useClassrooms();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");
  const filtered = classes.filter((item) =>
    (topic === "all" || item.topicId === topic) &&
    (level === "all" || item.level === level) &&
    `${item.name} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const classIds = new Set(classes.map((item) => item.id));
  function clearFilters() { setQuery(""); setTopic("all"); setLevel("all"); }

  return (
    <div className="classes-page">
      <header className="classes-header">
        <h1>Lớp của tôi</h1>
        <Link to="/instructor/classes/new" className="btn-primary"><Plus size={16} />Tạo lớp mới</Link>
      </header>
      <dl className="classes-summary">
        <div><dt>Lớp học</dt><dd>{classes.length}</dd></div>
        <div><dt>Sinh viên</dt><dd>{students.filter((student) => classIds.has(student.classId)).length}</dd></div>
        <div><dt>Bộ bài</dt><dd>{[...assignments, ...quizzes].filter((set) => classIds.has(set.classId)).length}</dd></div>
      </dl>
      <section aria-label="Danh sách lớp học" className="classes-directory">
        <div className="classes-toolbar">
          <label className="classes-search">
            <span className="sr-only">Tìm lớp học</span><Search size={16} aria-hidden="true" />
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên lớp..." />
            {query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery("")}><X size={15} /></button>}
          </label>
          <select aria-label="Lọc theo chủ đề" className="field classes-filter" value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="all">Tất cả chủ đề</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select aria-label="Lọc theo mức độ" className="field classes-filter" value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="all">Tất cả mức độ</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <span className="classes-result-count" role="status">{filtered.length} lớp</span>
        </div>
        {filtered.length > 0 ? (
          <table className="classes-table">
            <thead><tr><th>Lớp học</th><th>Chủ đề</th><th>Mức độ</th><th>Sinh viên</th><th>Bộ bài</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>{filtered.map((item) => {
              const members = students.filter((student) => student.classId === item.id).length;
              const sets = assignments.filter((set) => set.classId === item.id).length + quizzes.filter((quiz) => quiz.classId === item.id).length;
              return <tr key={item.id}>
                <td className="class-name-cell"><Link to={`/instructor/classes/${item.id}`}><span className="class-list-icon"><GraduationCap size={20} strokeWidth={1.5} /></span><span>{item.name}</span></Link></td>
                <td data-label="Chủ đề">{getTopic(item.topicId).name}</td>
                <td data-label="Mức độ"><span className={`class-level${item.level === "advanced" ? " is-advanced" : ""}`}>{getLevel(item.level).label}</span></td>
                <td data-label="Sinh viên" className="class-number">{members}</td>
                <td data-label="Bộ bài" className="class-number">{sets}</td>
                <td className="class-actions-cell"><div>
                  <Link className="class-assign" to={`/instructor/challenges/new?classId=${item.id}`} aria-label={`Giao thử thách cho ${item.name}`}><Send size={14} />Giao bài</Link>
                  <Link className="class-row-icon" to={`/instructor/progress?classId=${item.id}`} aria-label={`Xem tiến độ ${item.name}`} title="Xem tiến độ"><TrendingUp size={17} /></Link>
                  <Link className="class-row-icon" to={`/instructor/classes/${item.id}`} aria-label={`Mở lớp ${item.name}`} title="Mở lớp"><ArrowUpRight size={18} /></Link>
                </div></td>
              </tr>;
            })}</tbody>
          </table>
        ) : (
          <div className="instructor-empty">
            <GraduationCap size={26} /><h2>{classes.length ? "Không tìm thấy lớp phù hợp" : "Chưa có lớp học"}</h2>
            {classes.length ? <button className="btn-secondary" onClick={clearFilters}>Xóa bộ lọc</button> : <Link className="btn-primary" to="/instructor/classes/new">Tạo lớp mới</Link>}
          </div>
        )}
      </section>
    </div>
  );
}
