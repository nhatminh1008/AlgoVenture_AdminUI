import { useActionToast } from "../../../shared/components/useActionToast";
import { useText } from "../../../preferences/preferencesContext";
import { difficultyLabels } from "../recordLabels.js";
import { sortingLessons } from "../../../shared/curriculum/sortOrder.js";
import { collectionOperations } from "../../../shared/curriculum/collectionLessons.js";
import { useState } from "react";
import { updateLesson } from "./lessonService";

export default function LessonConfigurationForm({ lesson, onSaved }) {
  const text = useText();
  const toast = useActionToast();
  const [form, setForm] = useState(() => structuredClone(lesson));
  const [isSaving, setIsSaving] = useState(false);
  const required = lesson.requiredPrerequisites ?? [];
  function config(key, value) {
    setForm((previous) => ({
      ...previous,
      config: { ...previous.config, [key]: value },
    }));
  }
  async function save(e) {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { name, difficulty, status } = form;
      const { sortOrder, timeLimit, timeLimitsByDifficulty, hintsAllowed, prerequisites } = form.config;
      const rows = await updateLesson(lesson.id, {
        name, difficulty, status,
        config: { sortOrder, timeLimit, timeLimitsByDifficulty: timeLimitsByDifficulty ?? {}, hintsAllowed,
          prerequisites: prerequisites.filter((id) => !required.includes(id)) },
      });
      onSaved(rows);
      const saved = rows.find((row) => row.id === lesson.id);
      if (saved) setForm(structuredClone(saved));
      toast(text("Đã lưu cấu hình."));
    } catch (f) {
      toast(f.message, true);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="admin-form panel space-y-6 p-6">
      <h2 className="text-xl font-bold">{text(lesson.name)}</h2>
      <p className="text-sm">{text("Unity áp dụng cấu hình khi mở bài. Bài chưa công bố sẽ bị khóa và giữ tiến độ đã ghi nhận.",
        "Unity applies these settings when opening the lesson. Unpublished lessons are locked and recorded progress is kept.")}</p>
      <fieldset disabled={isSaving} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">{text("Tên hiển thị")}</span>
          <input
            className="field"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        {(lesson.hasSortOrder ?? sortingLessons.has(lesson.id)) && <label>
          <span className="field-label">{text("Chiều sắp xếp", "Sort order")}</span>
          <select className="field" value={form.config.sortOrder ?? "random"} onChange={e => config("sortOrder", e.target.value)}>
            <option value="random">{text("Ngẫu nhiên 50/50", "Random 50/50")}</option>
            <option value="ascending">{text("Tăng dần (nhỏ đến lớn)", "Ascending (small to large)")}</option>
            <option value="descending">{text("Giảm dần (lớn đến nhỏ)", "Descending (large to small)")}</option>
          </select>
          <span className="mt-1 block text-sm text-portal-muted">{text("Ngẫu nhiên chọn chiều một lần khi bắt đầu mỗi lượt chơi.", "Random chooses the order once at the start of each attempt.")}</span>
        </label>}
        {collectionOperations.has(lesson.id) && <div>
          <span className="field-label">{text("Độ khó")}</span>
          <p className="text-sm">{text("Dễ")}</p>
          <p className="mt-1 text-sm text-portal-muted">
            {text("Bài thao tác riêng có một mức.", "Single-operation lessons have one difficulty.")}
          </p>
        </div>}
        {lesson.hasDifficultyPresets && !collectionOperations.has(lesson.id) && <label>
          <span id="lesson-difficulty-label" className="field-label">{text("Độ khó bắt đầu tối thiểu", "Minimum starting difficulty")}</span>
          <select
            className="field"
            value={form.difficulty}
            aria-labelledby="lesson-difficulty-label"
            aria-describedby="lesson-difficulty-note"
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            {["Easy", "Medium", "Hard"].map((v) => (
              <option key={v} value={v}>{text(difficultyLabels[v], v)}</option>
            ))}
          </select>
          <span id="lesson-difficulty-note" className="mt-1 block text-sm text-portal-muted">
            {text("Người chơi có thể tiếp tục ở mức cao hơn theo tiến độ.", "Players can continue at a higher difficulty based on their progress.")}
          </span>
        </label>}
        <label>
          <span className="field-label">{text("Trạng thái")}</span>
          <select
            className="field"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {["Unpublished", "Publish"].map((v) => (
              <option key={v} value={v}>{v === "Publish" ? text("Đã công bố", "Published") : text("Chưa công bố", "Unpublished")}</option>
            ))}
          </select>
        </label>
        <label>
          <span id="lesson-time-label" className="field-label">{text("Giới hạn thời gian chung (giây)")}</span>
          <input
            className="field"
            type="number"
            min={10}
            max={86400}
            required
            aria-labelledby="lesson-time-label"
            aria-describedby="lesson-time-note"
            value={form.config.timeLimit}
            onChange={(e) => config("timeLimit", Number(e.target.value))}
          />
          <span id="lesson-time-note" className="mt-1 block text-sm text-portal-muted">
            {text("Áp dụng cho thử thách. Giới hạn riêng của bài giao được ưu tiên khi có.", "Applies to challenges. An assignment-specific limit takes precedence when configured.")}
          </span>
        </label>
      </div>
      {(lesson.hasDifficultyTimeLimits ?? lesson.hasDifficultyPresets) && <fieldset>
        <legend className="field-label">{text("Giới hạn theo độ khó (giây)", "Time limits by difficulty (seconds)")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Easy", "Medium", "Hard"].map((difficulty) => {
            const key = difficulty.toLowerCase();
            const limits = form.config.timeLimitsByDifficulty ?? {};
            return <label key={key}>
              <span className="field-label">{text(difficultyLabels[difficulty], difficulty)}</span>
              <input className="field" type="number" min={10} max={86400}
                value={limits[key] ?? ""} placeholder={String(form.config.timeLimit)}
                onChange={(event) => {
                  const next = { ...limits };
                  if (event.target.value === "") delete next[key];
                  else next[key] = Number(event.target.value);
                  config("timeLimitsByDifficulty", next);
                }} />
            </label>;
          })}
        </div>
        <p className="mt-1 text-sm text-portal-muted">{text("Ô trống dùng giới hạn chung của bài.", "Empty fields use the lesson's default limit.")}</p>
      </fieldset>}
      <section aria-labelledby="lesson-star-rules">
        <h3 id="lesson-star-rules" className="field-label">{text("Cách tính sao chung", "Shared star rules")}</h3>
        <p className="text-sm">{text(
          "Thời gian tính sao bằng thời gian chơi cộng tiền phạt. Hoàn thành trong 20% đầu được 3 sao, trong 50% đầu được 2 sao, trước khi hết giờ được 1 sao. Hết giờ hoặc chưa hoàn thành được 0 sao.",
          "Stars use active play time plus penalties. Finish within 20% for 3 stars, within 50% for 2 stars, or before time runs out for 1 star. A timeout or unfinished attempt earns 0 stars.",
        )}</p>
        <p className="mt-1 text-sm">{text(
          "Năm lỗi đầu lần lượt trừ 5%, 10%, 20%, 40% và 80% giới hạn ban đầu.",
          "The first five mistakes deduct 5%, 10%, 20%, 40%, and 80% of the original limit, respectively.",
        )}</p>
      </section>
      {lesson.hasHints && <label className="admin-check-option flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.config.hintsAllowed}
          onChange={(e) => config("hintsAllowed", e.target.checked)}
        />
        {text("Hiện gợi ý bước tiếp theo khi làm sai hoặc hết giờ", "Show a next-step hint after a mistake or timeout")}
      </label>}
      </fieldset>
      <div className="admin-form-actions flex gap-3">
        <button className="btn-primary" disabled={isSaving}>
          {isSaving ? text("Đang lưu…") : text("Lưu cấu hình")}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={isSaving}
          onClick={() => {
            setForm(structuredClone(lesson));
          }}
        >
          {text("Hoàn tác")}
        </button>
      </div>
    </form>
  );
}
