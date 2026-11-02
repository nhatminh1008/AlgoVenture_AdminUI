import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Layers,
  GraduationCap,
  ArrowDownUp,
  ArrowUpRight,
  TrendingUp,
  Network,
  Send,
  X,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import { topics, levels, getTopic, getLevel } from "../data/curriculum";

const topicIcons = { sorting: ArrowDownUp, searching: Search, "data-structures": Layers, graphs: Network };

export default function Classes() {
  const { classes, students, assignments, quizzes } = useClassrooms();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");
  const filtered = classes.filter(
    (item) =>
      (topic === "all" || item.topicId === topic) &&
      (level === "all" || item.level === level) &&
      `${item.name} ${item.description}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="classes-page">
      <header className="classes-header">
        <h1>Lớp của tôi <span>{classes.length}</span></h1>
        <Link to="/instructor/classes/new" className="btn-primary classes-create">
          <Plus size={18} /> Tạo lớp mới
        </Link>
      </header>
      <dl className="classes-overview">
        <div><span className="classes-overview-icon"><GraduationCap size={22} /></span><div><dt>Lớp học</dt><dd>{classes.length}</dd></div></div>
        <div><span className="classes-overview-icon"><Users size={22} /></span><div><dt>Sinh viên</dt><dd>{students.filter((student) => classes.some((item) => item.id === student.classId)).length}</dd></div></div>
        <div><span className="classes-overview-icon"><Layers size={22} /></span><div><dt>Bộ bài</dt><dd>{[...assignments, ...quizzes].filter((set) => classes.some((item) => item.id === set.classId)).length}</dd></div></div>
      </dl>
      <section aria-label="Danh sách lớp học">
        <div className="classes-toolbar">
          <label className="classes-search">
            <span className="sr-only">Tìm lớp học</span>
            <Search
              size={17}
              className="classes-search-icon"
            />
            <input
              className="field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên lớp..."
            />
            {query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery("")}><X size={16} /></button>}
          </label>
          <select
            aria-label="Lọc theo chủ đề"
            className="field classes-filter"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">Tất cả chủ đề</option>
            {topics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc theo mức độ"
            className="field classes-filter"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            {levels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="classes-list-heading"><h2>Danh sách lớp học</h2><span>{filtered.length} / {classes.length} lớp</span></div>
      <div className="classes-grid">
        {filtered.map((item) => {
          const topicInfo = getTopic(item.topicId);
          const TopicIcon = topicIcons[item.topicId] || GraduationCap;
          const members = students.filter(
            (student) => student.classId === item.id,
          ).length;
          const sets =
            assignments.filter((set) => set.classId === item.id).length +
            quizzes.filter((quiz) => quiz.classId === item.id).length;
          return (
            <article
              key={item.id}
              className={`class-card class-theme-${item.topicId}`}
            >
              <div className="class-card-content">
                <div className="class-card-top"><span className="class-topic-icon"><TopicIcon size={24} /></span><span className={`class-level ${item.level === "advanced" ? "class-level-advanced" : ""}`}><span />{getLevel(item.level).label}</span></div>
                <p className="class-topic">{topicInfo.name}</p>
                <h3>
                  <Link
                    to={`/instructor/classes/${item.id}`}
                  >
                    {item.name}
                  </Link>
                </h3>
                <div className="class-card-metrics">
                  <span>
                    <Users size={16} />
                    <strong>{members}</strong> sinh viên
                  </span>
                  <span>
                    <Layers size={16} />
                    <strong>{sets}</strong> bộ bài
                  </span>

                </div>
              </div>
              <div className="class-card-actions">
                <Link className="class-assign" to={`/instructor/challenges?classId=${item.id}`}><Send size={15} />Giao thử thách</Link>
                <Link className="class-progress" to={`/instructor/progress?classId=${item.id}`}><TrendingUp size={16} />Tiến độ</Link>
                <Link className="class-open" to={`/instructor/classes/${item.id}`} aria-label={`Mở lớp ${item.name}`} title="Mở lớp"><ArrowUpRight size={19} /></Link>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="panel p-12 text-center">
          <GraduationCap size={36} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-800">
            {classes.length
              ? "Không tìm thấy lớp phù hợp"
              : "Bắt đầu với lớp học đầu tiên"}
          </h3>
          {classes.length ? (
            <button
              className="btn-secondary mt-5"
              onClick={() => {
                setQuery("");
                setTopic("all");
                setLevel("all");
              }}
            >
              Xóa bộ lọc
            </button>
          ) : (
            <Link className="btn-primary mt-5" to="/instructor/classes/new">
              Tạo lớp mới
            </Link>
          )}
        </div>
      )}
      </section>
    </div>
  );
}
