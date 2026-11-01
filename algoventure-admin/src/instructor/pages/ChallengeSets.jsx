import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Plus, Check, BookOpen } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { getTopic, getLevel, lessonName } from "../data/curriculum";

const statusLabels = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};
export default function ChallengeSets() {
  const { classes, assignments, saveAssignment } = useClassrooms();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const classId = params.get("classId") ?? classes[0]?.id ?? "";
  const editingId = params.get("assignmentId");
  const existing = assignments.find(
    (item) => item.id === editingId && item.classId === classId,
  );
  const classroom = classes.find((item) => item.id === classId);
  if (editingId && !existing)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          Không tìm thấy bộ thử thách trong lớp này
        </h1>
        <Link className="btn-secondary mt-4" to="/instructor/challenges">
          Về bộ thử thách
        </Link>
      </div>
    );
  return (
    <ChallengeEditor
      key={`${classId}:${editingId ?? "new"}`}
      notice={location.state?.message ?? ""}
      {...{
        classes,
        assignments,
        saveAssignment,
        setParams,
        classId,
        existing,
        classroom,
      }}
    />
  );
}

function ChallengeEditor({
  classes,
  assignments,
  saveAssignment,
  setParams,
  classId,
  existing,
  classroom,
  notice,
}) {
  const [form, setForm] = useState(
    () =>
      existing ?? {
        classId,
        title: "",
        description: "",
        due: "",
        status: "Draft",
        lessonIds: [],
      },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(notice);
  const topic = classroom && getTopic(classroom.topicId);
  const readOnly = Boolean(existing && existing.status !== "Draft");
  const sets = assignments.filter((item) => item.classId === classId);
  function newSet() {
    setForm({
      classId,
      title: "",
      description: "",
      due: "",
      status: "Draft",
      lessonIds: [],
    });
    setError("");
    setMessage("");
    setParams({ classId });
  }
  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
    setMessage("");
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const item = await saveAssignment(form, existing?.id);
      const message =
        item.status === "Active"
          ? "Đã lưu bài giao cho lớp trên server. Game cần tích hợp API để nhận bài."
          : "Đã lưu bản nháp trên server.";
      setMessage(message);
      setError("");
      setParams({ classId, assignmentId: item.id }, { state: { message } });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb="Giảng viên / Bộ thử thách"
        title={
          readOnly
            ? "Chi tiết bộ thử thách"
            : existing
              ? "Chỉnh sửa bản nháp"
              : "Tạo bộ thử thách"
        }
      >
        <Link to="/instructor/classes" className="btn-secondary">
          Lớp của tôi
        </Link>
      </PageHeader>
      {!classes.length && (
        <p className="panel mb-6 p-6 text-sm">
          Bạn cần{" "}
          <Link
            to="/instructor/classes/new"
            className="font-semibold text-emerald-700"
          >
            tạo lớp học
          </Link>{" "}
          trước khi giao bài.
        </p>
      )}
      {!classroom && classes.length > 0 && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
        >
          Lớp không tồn tại trong danh sách bạn phụ trách. Hãy chọn một lớp
          khác.
        </p>
      )}
      <form onSubmit={save} className="grid items-start gap-6 lg:grid-cols-2">
        <section className="panel space-y-5 p-6">
          <h2 className="font-bold text-slate-900">Thông tin bộ bài</h2>
          <label className="block">
            <span className="field-label">Lớp nhận bài</span>
            <select
              className="field"
              value={classId}
              disabled={Boolean(existing)}
              required
              onChange={(e) => setParams({ classId: e.target.value })}
            >
              <option value="" disabled>
                Chọn lớp
              </option>
              {!classroom && classId && (
                <option value={classId}>Lớp không khả dụng</option>
              )}
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {classroom && (
            <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              {topic.name} · {getLevel(classroom.level).name}
            </p>
          )}
          <fieldset disabled={readOnly} className="space-y-5">
            <label className="block">
              <span className="field-label">Tên bộ thử thách *</span>
              <input
                className="field"
                required
                maxLength={100}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="VD: Luyện tập Sorting — Tuần 1"
              />
            </label>
            <label className="block">
              <span className="field-label">Hướng dẫn cho sinh viên</span>
              <textarea
                rows={3}
                className="field"
                maxLength={1000}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Hạn hoàn thành</span>
                <input
                  type="date"
                  className="field"
                  required={form.status === "Active"}
                  value={form.due}
                  onChange={(e) => update("due", e.target.value)}
                />
              </label>
              <label>
                <span className="field-label">Trạng thái</span>
                <select
                  className="field"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Active">Giao cho lớp</option>
                  {readOnly && <option value="Closed">Đã đóng</option>}
                </select>
              </label>
            </div>
          </fieldset>
          {readOnly && (
            <p className="text-xs leading-5 text-slate-500">
              Bộ bài đã công bố được giữ nguyên nội dung. Tạo bộ mới để thay đổi
              yêu cầu.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {message}
            </p>
          )}
          {!readOnly && (
            <button
              type="submit"
              className="btn-primary"
              disabled={!classroom || busy}
            >
              <Check size={17} />
              {form.status === "Active"
                ? "Lưu và giao cho lớp"
                : "Lưu bản nháp"}
            </button>
          )}
        </section>
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <BookOpen size={19} />
            Chọn bài học{" "}
            <span className="ml-auto text-xs font-normal text-slate-500">
              {form.lessonIds.length} đã chọn
            </span>
          </h2>
          <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">
            Các bài thuộc chủ đề của lớp, tương ứng với màn thử thách trong
            game.
          </p>
          <fieldset disabled={readOnly} className="space-y-2">
            {topic?.lessons.map(([id, name]) => (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm ${form.lessonIds.includes(id) ? "border-emerald-300 bg-emerald-50/60 text-emerald-900" : "border-slate-100 text-slate-600"}`}
              >
                <input
                  className="h-4 w-4 accent-emerald-600"
                  type="checkbox"
                  checked={form.lessonIds.includes(id)}
                  onChange={() =>
                    update(
                      "lessonIds",
                      form.lessonIds.includes(id)
                        ? form.lessonIds.filter((value) => value !== id)
                        : [...form.lessonIds, id],
                    )
                  }
                />
                {name}
              </label>
            ))}
          </fieldset>
          {!topic && (
            <p className="py-6 text-center text-sm text-slate-400">
              Chọn lớp để xem bài học.
            </p>
          )}
        </section>
      </form>
      <section className="panel mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h2 className="font-bold text-slate-900">Bộ thử thách của lớp</h2>
            <p className="mt-1 text-xs text-slate-500">
              {classroom?.name ?? "Chưa chọn lớp"}
            </p>
          </div>
          <button
            className="btn-secondary"
            disabled={!classroom}
            onClick={newSet}
          >
            <Plus size={16} />
            Tạo bộ mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên bộ bài</th>
                <th>Nội dung</th>
                <th>Hạn hoàn thành</th>
                <th>Trạng thái</th>
                <th>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sets.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.title}</td>
                  <td className="max-w-64 text-xs leading-5 text-slate-500">
                    {item.lessonIds.map(lessonName).join(", ")}
                  </td>
                  <td className="whitespace-nowrap">
                    {item.due || "Chưa đặt"}
                  </td>
                  <td>{statusLabels[item.status]}</td>
                  <td>
                    <button
                      className="font-semibold text-emerald-700"
                      onClick={() =>
                        setParams({ classId, assignmentId: item.id })
                      }
                    >
                      {item.status === "Draft" ? "Chỉnh sửa" : "Xem"}
                    </button>
                  </td>
                </tr>
              ))}
              {!sets.length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Chưa có bộ thử thách cho lớp này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
