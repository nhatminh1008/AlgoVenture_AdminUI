import { useText } from "../../../preferences/preferencesContext";
import { useId, useState } from "react";
import InstructorLink from "../workspace/InstructorLink";
import { BookOpen, Check } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";
import { TopicPicker } from "../../../shared/components/TopicPicker";
import { useClassrooms } from "../workspace/useClassrooms";

import { sortingLessons } from "../../../shared/curriculum/sortOrder.js";

const MAX_LESSONS = 25;
const lessonsWithStartingValues = new Set([
  "bubble", "selection", "insertion", "merge", "quick", "stack-push", "stack-pop", "stack-peek",
]);

export default function ChallengeEditor({ classes = [], saveAssignmentTemplate, initialClassId, existing, templateMode = false }) {
  const text = useText();
  const { topics, lessonName, duplicateAssignmentTemplate } = useClassrooms();
  const { finish } = useInstructorNavigation();
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
  const [titleError, setTitleError] = useState("");
  const titleErrorId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicIds, setTopicIds] = useState(() => topics
    .filter((topic) => topic.lessons.some(([id]) => existing?.lessonIds.includes(id)))
    .map((topic) => topic.id));
  const classId = form.classId;
  const classroom = classes.find(item => item.id === classId);
  const lessonGroups = topics.filter((topic) => topicIds.includes(topic.id));
  const availableLessonIds = lessonGroups.flatMap((topic) => topic.lessons.map(([id]) => id));
  const selectedLessonIds = new Set(form.lessonIds);
  const allSelected = availableLessonIds.every((id) => selectedLessonIds.has(id));
  const readOnly = !templateMode || Boolean(existing?.locked);
  const canEnterContent = templateMode || Boolean(classroom);
  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (field === "title") setTitleError("");
    setError("");
  }
  function selectTopics(ids) {
    setTopicIds(ids);
    const allowed = new Set(topics.filter((topic) => ids.includes(topic.id))
      .flatMap((topic) => topic.lessons.map(([id]) => id)));
    setForm((previous) => ({ ...previous, lessonIds: previous.lessonIds.filter((id) => allowed.has(id)) }));
    setError("");
  }
  async function save(event) {
    event.preventDefault();
    if (readOnly || isSubmitting || !form.lessonIds.length) return;
    const title = form.title.trim();
    setError("");
    setTitleError("");
    if (!title) {
      setTitleError("Hãy nhập tên bộ thử thách.");
      return;
    }
    setIsSubmitting(true);
    try {
      const lessonConfigs = structuredClone(Object.fromEntries(Object.entries(form.lessonConfigs ?? {}).filter(([id]) => form.lessonIds.includes(id))));
      for (const config of Object.values(lessonConfigs)) {
        if (typeof config.input === "string") {
          if (!/^\s*-?\d+(?:[\s,]+-?\d+)*\s*$/.test(config.input)) throw new Error("Nhập chuỗi số nguyên, cách nhau bằng dấu phẩy hoặc khoảng trắng.");
          config.input = config.input.trim().split(/[\s,]+/).map(Number);
        }
        if (config.input && (config.input.length < 2 || config.input.length > 8 || config.input.some(n => !Number.isInteger(n) || n < -99 || n > 99))) throw new Error("Chuỗi gồm 2–8 số nguyên từ -99 đến 99.");
      }
      await saveAssignmentTemplate({
        title, description: form.description, algorithmIds: form.lessonIds, algorithmConfigs: lessonConfigs,
      }, existing?.id);
      const message = text("Đã lưu bản nháp.");
      setError("");
      finish({ message });
    } catch (failure) {
      if (failure.fields?.title) setTitleError(failure.fields.title);
      else setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  async function duplicate() {
    setIsSubmitting(true);
    setError("");
    try {
      const template = await duplicateAssignmentTemplate(existing.id);
      finish({ to: `/instructor/challenges?assignmentTemplateId=${encodeURIComponent(template.id)}` });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink />
      <PageHeader
        title={
          readOnly && existing
            ? text("Chi tiết bộ thử thách")
            : existing
              ? text("Chỉnh sửa bản nháp")
              : text("Tạo bộ thử thách")
        }
      >
        {templateMode && existing?.locked && (
          <button type="button" className="btn-primary" onClick={duplicate} disabled={isSubmitting}>
            {text("Nhân bản đề", "Duplicate template")}
          </button>
        )}
      </PageHeader>
      {!templateMode && !classes.length && (
        <p className="panel mb-6 p-6 text-sm">
          {text("Bạn cần")}{" "}
          <InstructorLink
            to="/instructor/classes/new"

            className="font-semibold text-portal-purple-strong"
          >
            {text("tạo lớp học")}
          </InstructorLink>{" "}
          {text("trước khi giao bài.")}
        </p>
      )}
      {classId && !classroom && classes.length > 0 && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
        >
          {text("Lớp không tồn tại trong danh sách bạn phụ trách. Hãy chọn một lớp khác.")}
        </p>
      )}
      <form onSubmit={save} className="challenge-editor-layout">
        <section className="panel space-y-5 p-6">
          <h2 className="font-bold text-slate-900">{text("Thông tin bộ bài")}</h2>
          {!templateMode && <label className="block">
            <span className="field-label">{text("Lớp nhận bài")}</span>
            <select
              className="field"
              value={classId}
              disabled={Boolean(existing) || isSubmitting}
              required
              onChange={e => {
                setForm(previous => ({ ...previous, classId: e.target.value, lessonIds: [], lessonConfigs: {} }));
                setTopicIds([]);
                setError("");
              }}
            >
              <option value="" disabled>
                {text("Chọn lớp")}
              </option>
              {!classroom && classId && (
                <option value={classId}>{text("Lớp không khả dụng")}</option>
              )}
              {classes.map((item) => (
                <option key={item.id} value={item.id} disabled={Boolean(item.archivedAt)}>
                  {item.name}{item.archivedAt ? text(" (Đã lưu trữ)") : ""}
                </option>
              ))}
            </select>
          </label>}
          {classroom && (
            <p className="rounded-lg bg-portal-lavender p-3 text-xs text-portal-ink">
              {text(getLevel(classroom.level)?.label ?? classroom.level)}
            </p>
          )}
          <fieldset disabled={readOnly || isSubmitting} className="space-y-5">
            <label className="block">
              <span className="field-label">{text("Tên bộ thử thách *")}</span>
              <input
                className="field"
                required
                maxLength={100}
                value={form.title}
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? titleErrorId : undefined}
                onChange={(e) => update("title", e.target.value)}
                placeholder={text("VD: Luyện tập Sorting — Tuần 1")}
              />
              {titleError && <span id={titleErrorId} role="alert" className="mt-1 block text-sm text-red-700">{text(titleError)}</span>}
            </label>
            <label className="block">
              <span className="field-label">{text("Hướng dẫn cho sinh viên")}</span>
              <textarea
                rows={3}
                className="field"
                maxLength={1000}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </label>
            {!templateMode && <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">{text("Hạn hoàn thành")}</span>
                <input
                  type="date"
                  className="field"
                  value={form.due}
                  onChange={(e) => update("due", e.target.value)}
                />
              </label>
            </div>}
          </fieldset>
          {readOnly && (
            <p className="text-xs leading-5 text-slate-500">
              {templateMode ? text("Đề đã được giao. Nhân bản để sửa nội dung.", "This template has been assigned. Duplicate it to make changes.")
                : existing?.archivedAt ? text("Bộ thử thách đã lưu trữ.")
                : classroom?.archivedAt ? text("Lớp học đã lưu trữ.")
                  : existing?.status === "Closed" ? text("Bộ thử thách đã đóng.")
                    : text("Bộ bài đã công bố. Không thể chỉnh sửa nội dung.")}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {text(error)}
            </p>
          )}
          {!readOnly && (
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={!form.lessonIds.length || isSubmitting}>
                <Check size={17} />{isSubmitting ? text("Đang lưu…") : text("Lưu bộ thử thách", "Save challenge set")}
              </button>
              <InstructorBackLink plain className="btn-secondary">{text("Hủy", "Cancel")}</InstructorBackLink>
            </div>
          )}
        </section>
        <section className="panel p-6">
          <div className="mb-5">
            <TopicPicker topics={readOnly ? lessonGroups : topics} value={topicIds} onChange={selectTopics}
              disabled={!canEnterContent || readOnly || isSubmitting} />
          </div>
          <h2 className="instructor-section-title instructor-lesson-heading">
            <BookOpen size={19} />
            {text("Chọn thuật toán", "Select algorithms")}{" "}
            <span className="ml-auto text-xs font-normal text-slate-500">
              {form.lessonIds.length}/{MAX_LESSONS} {text(" đã chọn")}
            </span>
          </h2>
          {!readOnly && availableLessonIds.length > 0 && availableLessonIds.length <= MAX_LESSONS && (
            <button disabled={isSubmitting} type="button" className="instructor-touch-link mb-3 inline-flex text-sm font-semibold text-portal-purple-strong"
              onClick={() => update("lessonIds", allSelected ? [] : availableLessonIds)}>
              {allSelected ? text("Bỏ chọn tất cả") : text("Chọn tất cả bài")}
            </button>
          )}
          <fieldset disabled={readOnly || isSubmitting} className="space-y-4">
            {lessonGroups.map((topic) => (
              <fieldset key={topic.id} className="space-y-2">
                <legend className="mb-2 text-sm font-bold">{text(topic.label)}</legend>
                {topic.lessons.map(([id, name]) => (
                  <label
                    key={id}
                    className={`instructor-pick flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm ${selectedLessonIds.has(id) ? "border-portal-line-strong bg-portal-lavender/60 text-portal-ink" : "border-slate-100 text-slate-600"}`}
                  >
                    <input
                      className="h-4 w-4 accent-portal-purple"
                      type="checkbox"
                      checked={selectedLessonIds.has(id)}
                      disabled={!selectedLessonIds.has(id) && selectedLessonIds.size >= MAX_LESSONS}
                      onChange={() => update(
                        "lessonIds",
                        selectedLessonIds.has(id) ? form.lessonIds.filter((value) => value !== id) : [...form.lessonIds, id],
                      )}
                    />
                    {text(name)}
                  </label>
                ))}
              </fieldset>
            ))}
          </fieldset>
          {form.lessonIds.map(id => {
            const config = form.lessonConfigs?.[id];
            const stack = id.startsWith("stack-");
            const hasStartingValues = lessonsWithStartingValues.has(id);
            const configure = (field, value) => update("lessonConfigs", { ...form.lessonConfigs, [id]: { ...config, [field]: value } });
            return <fieldset key={id} disabled={readOnly || isSubmitting} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-bold">{text("Cấu hình ")} {lessonName(id)}</legend>
              <label className="instructor-pick flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(config)} onChange={event => {
                const next = { ...form.lessonConfigs };
                if (event.target.checked) next[id] = { timeLimitSeconds: 300, difficulty: "easy" };
                else delete next[id];
                update("lessonConfigs", next);
              }} />{text("Tùy chỉnh cho bài giao này")}</label>
              {config && <>
                <label className="block"><span className="field-label">{text("Thời gian làm bài (giây)")}</span><input className="field" type="number" min="30" max="3600" required value={config.timeLimitSeconds} onChange={e => configure("timeLimitSeconds", Number(e.target.value))} /></label>
                <label className="block"><span className="field-label">{text("Độ khó")}</span><select className="field" value={config.difficulty} onChange={e => configure("difficulty", e.target.value)}><option value="easy">{text("Dễ")}</option><option value="medium">{text("Vừa")}</option><option value="hard">{text("Khó")}</option></select></label>
                {sortingLessons.has(id) && <label className="block">
                  <span className="field-label">{text("Chiều sắp xếp", "Sort order")}</span>
                  <select className="field" value={config.sortOrder ?? ""} onChange={e => {
                    const next = { ...config };
                    if (e.target.value) next.sortOrder = e.target.value;
                    else delete next.sortOrder;
                    update("lessonConfigs", { ...form.lessonConfigs, [id]: next });
                  }}>
                    <option value="">{text("Theo cấu hình bài học", "Use lesson settings")}</option>
                    <option value="random">{text("Ngẫu nhiên 50/50", "Random 50/50")}</option>
                    <option value="ascending">{text("Tăng dần (nhỏ đến lớn)", "Ascending (small to large)")}</option>
                    <option value="descending">{text("Giảm dần (lớn đến nhỏ)", "Descending (large to small)")}</option>
                  </select>
                </label>}
                {hasStartingValues ? <label className="block"><span className="field-label">{text("Chuỗi số ban đầu")}</span><input className="field" value={Array.isArray(config.input) ? config.input.join(", ") : config.input ?? ""} placeholder="VD: 8, 3, 6, 2, 5" onChange={e => {
                  const next = { ...config };
                  if (e.target.value.trim()) next.input = e.target.value;
                  else delete next.input;
                  update("lessonConfigs", { ...form.lessonConfigs, [id]: next });
                }} /><span className="mt-1 block text-xs text-slate-500">{text("2–8 số nguyên từ -99 đến 99. Để trống để tạo đề theo độ khó. Cấu hình được giữ cố định sau khi giao.")}</span>
                  {stack && <span className="mt-1 block text-xs text-slate-500">{id === "stack-push"
                    ? text("Thẻ được đưa vào ngăn xếp theo thứ tự nhập.", "Cards are pushed in the order entered.")
                    : text("Nhập từ đáy lên đỉnh. Số cuối cùng là đỉnh ngăn xếp.", "Enter values from bottom to top. The last value starts on top.")}</span>}
                </label> : <p className="text-xs text-slate-500">{text(
                  "Cấu hình được lưu cùng bài giao và đang chờ tích hợp vào mục Bài được giao trong Unity.",
                  "Settings are saved with the assignment. Support in Unity’s assignment area is pending.",
                )}</p>}
              </>}
            </fieldset>;
          })}
          {!lessonGroups.length && (
            <p className="py-6 text-center text-sm text-slate-400">
              {text("Chọn cấu trúc dữ liệu để xem các thuật toán.", "Select data structures to see their algorithms.")}
            </p>
          )}
        </section>
      </form>
    </div>
  );
}
