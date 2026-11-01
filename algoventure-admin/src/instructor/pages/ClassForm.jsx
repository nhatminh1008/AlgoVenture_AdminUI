import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, BookOpen } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { topics, levels, getTopic, getLevel } from "../data/curriculum";

export default function ClassForm() {
  const { classId } = useParams();
  const { classes, assignments, quizzes, saveClass } = useClassrooms();
  const existing = classes.find((item) => item.id === classId);
  const navigate = useNavigate();
  const [values, setValues] = useState(
    () =>
      existing ?? { name: "", description: "", topicId: "", level: "basic" },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (classId && !existing)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">Không tìm thấy lớp học</h1>
        <Link className="btn-secondary mt-4" to="/instructor/classes">
          Về lớp của tôi
        </Link>
      </div>
    );
  const topic = getTopic(values.topicId);
  const topicLocked = Boolean(
    existing &&
      (assignments.some((item) => item.classId === classId) ||
        quizzes.some((item) => item.classId === classId)),
  );
  function field(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setError("");
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const item = await saveClass(values, classId);
      navigate(`/instructor/classes/${item.id}`, {
        state: {
          message: classId
            ? "Đã cập nhật thông tin lớp."
            : "Đã tạo lớp. Bạn có thể bắt đầu chuẩn bị bộ thử thách.",
        },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
        to={existing ? `/instructor/classes/${classId}` : "/instructor/classes"}
      >
        <ArrowLeft size={16} />
        Quay lại
      </Link>
      <PageHeader
        title={classId ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="panel space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Thông tin lớp học
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Chọn một chủ đề DSA và mức độ phù hợp với sinh viên.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="class-name">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              id="class-name"
              className="field"
              autoFocus
              required
              maxLength={100}
              value={values.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="VD: Sorting cơ bản — SE19"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="class-topic">
              Chủ đề <span className="text-red-500">*</span>
            </label>
            <select
              id="class-topic"
              className="field"
              required
              disabled={topicLocked}
              value={values.topicId}
              onChange={(e) => field("topicId", e.target.value)}
            >
              <option value="" disabled>
                Chọn chủ đề học tập
              </option>
              {topics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.label}
                </option>
              ))}
            </select>
            {topicLocked && (
              <p className="mt-2 text-xs text-slate-500">
                Lớp đã có bộ bài nên chủ đề được giữ để bảo toàn nội dung.
              </p>
            )}
          </div>
          <fieldset>
            <legend className="field-label">
              Mức độ lớp học <span className="text-red-500">*</span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {levels.map((item) => (
                <label
                  key={item.id}
                  className={`cursor-pointer rounded-xl border p-4 ${values.level === item.id ? "border-emerald-500 bg-emerald-50/70" : "border-slate-200"}`}
                >
                  <span className="mb-2 flex items-center gap-2">
                    <input
                      type="radio"
                      name="level"
                      value={item.id}
                      checked={values.level === item.id}
                      onChange={() => field("level", item.id)}
                      className="accent-emerald-600"
                    />
                    <strong className="text-sm text-slate-800">
                      {item.name}
                    </strong>
                    <span className="text-xs text-slate-500">{item.label}</span>
                  </span>
                  <span className="block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Mức độ định hướng lớp học; không phải điểm hay mức thành thạo do
              hệ thống adaptive ước lượng.
            </p>
          </fieldset>
          <div>
            <label className="field-label" htmlFor="class-description">
              Mô tả và mục tiêu học tập
            </label>
            <textarea
              id="class-description"
              className="field"
              rows={4}
              maxLength={500}
              value={values.description}
              onChange={(e) => field("description", e.target.value)}
              placeholder="Sinh viên sẽ luyện tập những kiến thức và kỹ năng nào?"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {values.description.length}/500
            </p>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Link
              className="btn-secondary"
              to={
                existing
                  ? `/instructor/classes/${classId}`
                  : "/instructor/classes"
              }
            >
              Hủy
            </Link>
            <button className="btn-primary" type="submit" disabled={busy}>
              <Check size={17} />
              {classId ? "Lưu thay đổi" : "Tạo lớp học"}
            </button>
          </div>
        </form>
        <aside className="panel p-6">
          <span className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <BookOpen size={24} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Nội dung của lớp
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">
            {topic?.name ?? "Chọn chủ đề để xem bài học"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {topic?.description ??
              "Các bài học tương ứng với nội dung hiện có trong game AlgoVenture."}
          </p>
          <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {getLevel(values.level).name}
          </span>
          {topic && (
            <>
              <p className="mb-3 mt-6 text-xs font-semibold text-slate-500">
                {topic.lessons.length} bài có thể chọn khi tạo bộ thử thách
              </p>
              <ul className="space-y-2">
                {topic.lessons.map(([id, name]) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Check size={14} className="shrink-0 text-emerald-500" />
                    {name}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            Tạo lớp chưa tự giao toàn bộ bài học. Bạn sẽ chọn bộ thử thách phù
            hợp sau khi tạo.
          </p>
        </aside>
      </div>
    </div>
  );
}
