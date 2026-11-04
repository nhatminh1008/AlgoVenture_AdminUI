import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Check, BookOpen } from "lucide-react";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
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
  const [params] = useSearchParams();
  const location = useLocation();
  const editingId = params.get("assignmentId");
  const creating = location.pathname.endsWith("/new");
  if (!creating && !editingId) return <ChallengeList />;
  const existing = assignments.find(item => item.id === editingId);
  const classId = existing?.classId ?? params.get("classId") ?? "";
  if (editingId && (!existing || (params.has("classId") && params.get("classId") !== existing.classId)))
    return <div className="panel p-8"><h1 className="text-xl font-bold">Không tìm thấy bộ thử thách</h1><Link className="btn-secondary mt-4" to="/instructor/challenges">Về bộ thử thách</Link></div>;
  return <ChallengeEditor key={editingId ?? "new"} classes={classes} saveAssignment={saveAssignment} initialClassId={classId} existing={existing} />;
}

function ChallengeList() {
  const scope = useClassScope();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const classNames = new Map(scope.classes.map(item => [item.id, item.name]));
  const sets = scope.sets.filter(item => (!status || item.status === status) &&
    `${item.title} ${classNames.get(item.classId) ?? ""}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const createUrl = `/instructor/challenges/new${scope.classroom ? `?classId=${encodeURIComponent(scope.classroom.id)}` : ""}`;
  return <div className="mx-auto max-w-6xl">
    <PageHeader title="Bộ thử thách"><Link to={createUrl} className="btn-primary"><Plus size={17} />Tạo bộ thử thách</Link></PageHeader>
    <p className="mb-6 text-sm text-slate-500">Quản lý các bộ thử thách trong tất cả lớp bạn phụ trách.</p>
    {location.state?.message && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{location.state.message}</p>}
    <dl className="classes-summary mb-6">
      <div><dt>Tổng bộ thử thách</dt><dd>{scope.sets.length}</dd></div>
      <div><dt>Đang giao</dt><dd>{scope.sets.filter(item => item.status === "Active").length}</dd></div>
      <div><dt>Bản nháp</dt><dd>{scope.sets.filter(item => item.status === "Draft").length}</dd></div>
    </dl>
    <section className="panel overflow-hidden" aria-label="Danh sách bộ thử thách">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-5">
        <ClassFilter scope={scope} />
        <label className="min-w-0 flex-1"><span className="sr-only">Tìm bộ thử thách</span><input className="field" type="search" placeholder="Tìm theo tên bộ bài hoặc lớp…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label><span className="sr-only">Lọc theo trạng thái</span><select className="field" value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {scope.invalid && <p role="alert" className="p-5 text-sm text-amber-800">Lớp không tồn tại trong danh sách bạn phụ trách. Hãy chọn một lớp khác.</p>}
      <div className="overflow-x-auto"><table className="data-table">
        <thead><tr><th>Tên bộ thử thách</th><th>Lớp nhận bài</th><th>Nội dung</th><th>Hạn hoàn thành</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{sets.map(item => <tr key={item.id}>
          <td className="font-semibold text-slate-900">{item.title}</td><td>{classNames.get(item.classId) ?? "Lớp không khả dụng"}</td>
          <td className="max-w-64 text-xs leading-5 text-slate-500">{item.lessonIds.map(lessonName).join(", ")}</td>
          <td className="whitespace-nowrap">{item.due || "Chưa đặt"}</td>
          <td><span className={`instructor-badge ${item.status === "Draft" ? "instructor-badge-draft" : item.status === "Closed" ? "instructor-badge-closed" : ""}`}>{statusLabels[item.status]}</span></td>
          <td><Link className="whitespace-nowrap font-semibold text-portal-purple-strong" aria-label={`${item.status === "Draft" ? "Chỉnh sửa" : "Xem"}: ${item.title}`} to={`/instructor/challenges?assignmentId=${encodeURIComponent(item.id)}`}>{item.status === "Draft" ? "Chỉnh sửa" : "Xem chi tiết"}</Link></td>
        </tr>)}</tbody>
      </table></div>
      {!sets.length && <div className="p-10 text-center"><BookOpen size={32} className="mx-auto mb-3 text-slate-300" /><h2 className="font-semibold">{scope.sets.length || query || status || scope.invalid ? "Không tìm thấy bộ thử thách phù hợp" : "Chưa có bộ thử thách"}</h2><p className="mt-2 text-sm text-slate-500">{scope.sets.length || query || status || scope.invalid ? "Thử thay đổi lớp, trạng thái hoặc từ khóa tìm kiếm." : "Tạo bộ thử thách mới và chọn lớp nhận bài để bắt đầu."}</p>{!scope.invalid && <Link className="btn-primary mt-5" to={createUrl}><Plus size={16} />Tạo bộ thử thách</Link>}</div>}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Hiển thị {sets.length} / {scope.sets.length} bộ thử thách</p>
    </section>
  </div>;
}

function ChallengeEditor({ classes, saveAssignment, initialClassId, existing }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(
    () =>
      existing ?? {
        classId: initialClassId,
        title: "",
        description: "",
        due: "",
        status: "Draft",
        lessonIds: [],
      },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const classId = form.classId;
  const classroom = classes.find(item => item.id === classId);
  const topic = classroom && getTopic(classroom.topicId);
  const readOnly = Boolean(existing && existing.status !== "Draft");
  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const status = event.nativeEvent.submitter?.value === "Active" ? "Active" : "Draft";
    if (status === "Active" && !form.due) {
      setError("Chọn hạn hoàn thành trước khi giao cho lớp.");
      return;
    }
    setBusy(true);
    try {
      const lessonConfigs = structuredClone(Object.fromEntries(Object.entries(form.lessonConfigs ?? {}).filter(([id]) => form.lessonIds.includes(id))));
      for (const config of Object.values(lessonConfigs)) {
        if (typeof config.input === "string") {
          if (!/^\s*-?\d+(?:[\s,]+-?\d+)*\s*$/.test(config.input)) throw new Error("Nhập chuỗi số nguyên, cách nhau bằng dấu phẩy hoặc khoảng trắng.");
          config.input = config.input.trim().split(/[\s,]+/).map(Number);
        }
        if (config.input && (config.input.length < 2 || config.input.length > 8 || config.input.some(n => !Number.isInteger(n) || n < -99 || n > 99))) throw new Error("Chuỗi gồm 2–8 số nguyên từ -99 đến 99.");
      }
      const item = await saveAssignment({ ...form, lessonConfigs, status }, existing?.id);
      const message =
        item.status === "Active"
          ? "Đã giao bộ thử thách."
          : "Đã lưu bản nháp.";
      setError("");
      navigate("/instructor/challenges", { state: { message } });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={
          readOnly
            ? "Chi tiết bộ thử thách"
            : existing
              ? "Chỉnh sửa bản nháp"
              : "Tạo bộ thử thách"
        }
      >
        <Link to="/instructor/challenges" className="btn-secondary">Về bộ thử thách</Link>
      </PageHeader>
      {!classes.length && (
        <p className="panel mb-6 p-6 text-sm">
          Bạn cần{" "}
          <Link
            to="/instructor/classes/new"
            className="font-semibold text-portal-purple-strong"
          >
            tạo lớp học
          </Link>{" "}
          trước khi giao bài.
        </p>
      )}
      {classId && !classroom && classes.length > 0 && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
        >
          Lớp không tồn tại trong danh sách bạn phụ trách. Hãy chọn một lớp
          khác.
        </p>
      )}
      <form onSubmit={save} className="challenge-editor-layout">
        <section className="panel space-y-5 p-6">
          <h2 className="font-bold text-slate-900">Thông tin bộ bài</h2>
          <label className="block">
            <span className="field-label">Lớp nhận bài</span>
            <select
              className="field"
              value={classId}
              disabled={Boolean(existing) || busy}
              required
              onChange={e => {
                setForm(previous => ({ ...previous, classId: e.target.value, lessonIds: [], lessonConfigs: {} }));
                setError("");
              }}
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
            <p className="rounded-lg bg-portal-lavender p-3 text-xs text-portal-ink">
              {topic.name} · {getLevel(classroom.level).name}
            </p>
          )}
          <fieldset disabled={readOnly || busy} className="space-y-5">
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
                  value={form.due}
                  onChange={(e) => update("due", e.target.value)}
                />
              </label>
            </div>
          </fieldset>
          {readOnly && (
            <p className="text-xs leading-5 text-slate-500">
              Bộ bài đã công bố. Không thể chỉnh sửa nội dung.
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
          {!readOnly && (
            <div className="flex flex-wrap gap-3">
              <button type="submit" name="status" value="Draft" className="btn-secondary" disabled={!classroom || busy}>Lưu bản nháp</button>
              <button type="submit" name="status" value="Active" className="btn-primary" disabled={!classroom || busy}><Check size={17} />{busy ? "Đang lưu…" : "Giao cho lớp"}</button>
            </div>
          )}
        </section>
        <section className="panel p-6">
          <h2 className="instructor-section-title instructor-lesson-heading">
            <BookOpen size={19} />
            Chọn bài học{" "}
            <span className="ml-auto text-xs font-normal text-slate-500">
              {form.lessonIds.length} đã chọn
            </span>
          </h2>
          {!readOnly && topic && <button disabled={busy} type="button" className="mb-3 text-sm font-semibold text-portal-purple-strong" onClick={() => update("lessonIds", form.lessonIds.length === topic.lessons.length ? [] : topic.lessons.map(([id]) => id))}>{form.lessonIds.length === topic.lessons.length ? "Bỏ chọn tất cả" : "Chọn tất cả bài"}</button>}
          <fieldset disabled={readOnly || busy} className="space-y-2">
            {topic?.lessons.map(([id, name]) => (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm ${form.lessonIds.includes(id) ? "border-portal-line-strong bg-portal-lavender/60 text-portal-ink" : "border-slate-100 text-slate-600"}`}
              >
                <input
                  className="h-4 w-4 accent-portal-purple"
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
          {form.lessonIds.filter(id => ["bubble", "selection", "insertion", "merge", "quick"].includes(id)).map(id => {
            const config = form.lessonConfigs?.[id];
            const configure = (field, value) => update("lessonConfigs", { ...form.lessonConfigs, [id]: { ...config, [field]: value } });
            return <fieldset key={id} disabled={readOnly || busy} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-bold">Cấu hình {lessonName(id)}</legend>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(config)} onChange={event => {
                const next = { ...form.lessonConfigs };
                if (event.target.checked) next[id] = { timeLimitSeconds: 300, difficulty: "easy" };
                else delete next[id];
                update("lessonConfigs", next);
              }} />Tùy chỉnh cho bài giao này</label>
              {config && <>
                <label className="block"><span className="field-label">Thời gian làm bài (giây)</span><input className="field" type="number" min="30" max="3600" required value={config.timeLimitSeconds} onChange={e => configure("timeLimitSeconds", Number(e.target.value))} /></label>
                <label className="block"><span className="field-label">Độ khó</span><select className="field" value={config.difficulty} onChange={e => configure("difficulty", e.target.value)}><option value="easy">Dễ</option><option value="medium">Vừa</option><option value="hard">Khó</option></select></label>
                <label className="block"><span className="field-label">Chuỗi số ban đầu</span><input className="field" value={Array.isArray(config.input) ? config.input.join(", ") : config.input ?? ""} placeholder="VD: 8, 3, 6, 2, 5" onChange={e => {
                  const next = { ...config };
                  if (e.target.value.trim()) next.input = e.target.value;
                  else delete next.input;
                  update("lessonConfigs", { ...form.lessonConfigs, [id]: next });
                }} /><span className="mt-1 block text-xs text-slate-500">2–8 số nguyên từ -99 đến 99. Để trống để tạo đề theo độ khó. Cấu hình được giữ cố định sau khi giao.</span></label>
              </>}
            </fieldset>;
          })}
          {!topic && (
            <p className="py-6 text-center text-sm text-slate-400">
              Chọn lớp để xem bài học.
            </p>
          )}
        </section>
      </form>
    </div>
  );
}
