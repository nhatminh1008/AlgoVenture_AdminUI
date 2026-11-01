import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Layers,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { topics, levels, getTopic, getLevel } from "../data/curriculum";

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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Lớp của tôi"
      >
        <Link to="/instructor/classes/new" className="btn-primary">
          <Plus size={18} /> Tạo lớp mới
        </Link>
      </PageHeader>
      <p className="mb-5 text-sm text-slate-500">Chọn lớp để giao bài, theo dõi tiến độ hoặc xem kết quả.</p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Danh sách lớp học
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filtered.length} / {classes.length} lớp bạn phụ trách
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-3 lg:w-auto">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Tìm lớp học</span>
            <Search
              size={17}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="field pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên lớp..."
            />
          </label>
          <select
            aria-label="Lọc theo chủ đề"
            className="field w-auto flex-1 lg:flex-none"
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
            className="field w-auto flex-1 lg:flex-none"
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
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => {
          const topicInfo = getTopic(item.topicId);
          const members = students.filter(
            (student) => student.classId === item.id,
          ).length;
          const sets =
            assignments.filter((set) => set.classId === item.id).length +
            quizzes.filter((quiz) => quiz.classId === item.id).length;
          return (
            <article
              key={item.id}
              className="panel flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <div
                className={`h-1.5 ${item.level === "advanced" ? "bg-indigo-400" : "bg-emerald-400"}`}
              />
              <div className="flex flex-1 flex-col p-6">
                <p className="mb-2 text-xs text-slate-500">{topicInfo.name} · {getLevel(item.level).name}</p>
                <h3 className="break-words text-lg font-bold leading-7 text-slate-900">
                  <Link
                    to={`/instructor/classes/${item.id}`}
                    className="hover:text-emerald-700"
                  >
                    {item.name}
                  </Link>
                </h3>
                <div className="mt-auto flex flex-wrap gap-4 pt-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users size={15} />
                    {members} sinh viên
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers size={15} />
                    {sets} bộ bài
                  </span>

                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                <Link className="btn-primary" to={`/instructor/challenges?classId=${item.id}`}>Giao thử thách</Link>
                <Link className="btn-secondary" to={`/instructor/progress?classId=${item.id}`}>Xem tiến độ</Link>
                <Link className="btn-secondary" to={`/instructor/classes/${item.id}`}>Mở lớp</Link>
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
          <p className="mt-2 text-sm text-slate-500">
            {classes.length
              ? "Thử tìm tên khác hoặc thay đổi bộ lọc."
              : "Tạo lớp để bắt đầu giao bài cho sinh viên."}
          </p>
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
    </div>
  );
}
