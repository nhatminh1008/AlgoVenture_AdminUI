import { useActionToast } from "../../../shared/components/useActionToast";
import { useLocale, useText } from "../../../preferences/preferencesContext";
import { difficultyLabels } from "../recordLabels.js";
import { sortingLessons } from "../../../shared/curriculum/sortOrder.js";
import { collectionOperations } from "../../../shared/curriculum/collectionLessons.js";
import { useState } from "react";
import { Clock3, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { updateLesson } from "./lessonService";
import LessonScoringRules from "./LessonScoringRules";

export default function LessonConfigurationForm({ lesson, onSaved }) {
  const text = useText();
  const locale = useLocale();
  const toast = useActionToast();
  const [form, setForm] = useState(() => structuredClone(lesson));
  const [isSaving, setIsSaving] = useState(false);
  const required = lesson.requiredPrerequisites ?? [];
  const hasTimeOverrides = lesson.hasDifficultyTimeLimits ?? lesson.hasDifficultyPresets;
  const usesStages = hasTimeOverrides && !lesson.hasDifficultyPresets;
  const mapStageTimes = lesson.hasMapStageTimeLimits;
  const { timeLimit, timeLimitsByDifficulty } = form.config;
  const overrides = timeLimitsByDifficulty ?? {};
  const validDefaultLimit = Number.isInteger(timeLimit) && timeLimit >= 10 && timeLimit <= 86400;
  const defaultLimitLabel = validDefaultLimit
    ? text(`Dùng chung · ${timeLimit.toLocaleString(locale)} giây`, `Default · ${timeLimit.toLocaleString(locale)} sec`)
    : text("Dùng giới hạn chung", "Uses the default limit");
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
    <form onSubmit={save} className="lesson-config-grid">
      <fieldset disabled={isSaving} className="lesson-config-settings">
        <section className="panel lesson-config-card" aria-labelledby="lesson-general-title">
          <div className="lesson-config-card-head">
            <span className="lesson-config-icon" aria-hidden="true"><SlidersHorizontal size={19} /></span>
            <div>
              <h2 id="lesson-general-title">{text("Thông tin bài học", "Lesson settings")}</h2>
            </div>
          </div>
          <div className="lesson-config-fields">
            <label>
              <span className="field-label">{text("Tên hiển thị")}</span>
              <input className="field" required maxLength={100} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              <span className="field-label">{text("Trạng thái")}</span>
              <select className="field" value={form.status} aria-describedby="lesson-status-note"
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Publish">{text("Đã công bố", "Published")}</option>
                <option value="Unpublished">{text("Chưa công bố", "Unpublished")}</option>
              </select>
              <span id="lesson-status-note" className="lesson-config-help">{text(
                "Chưa công bố sẽ khóa bài và giữ tiến độ.",
                "Unpublishing locks the lesson and keeps progress.",
              )}</span>
            </label>
            {(lesson.hasSortOrder ?? sortingLessons.has(lesson.id)) && <label>
              <span className="field-label">{text("Chiều sắp xếp", "Sort order")}</span>
              <select className="field" value={form.config.sortOrder ?? "random"} onChange={(e) => config("sortOrder", e.target.value)}
                aria-describedby={form.config.sortOrder === "random" || !form.config.sortOrder ? "lesson-sort-note" : undefined}>
                <option value="random">{text("Ngẫu nhiên 50/50", "Random 50/50")}</option>
                <option value="ascending">{text("Tăng dần (nhỏ đến lớn)", "Ascending (small to large)")}</option>
                <option value="descending">{text("Giảm dần (lớn đến nhỏ)", "Descending (large to small)")}</option>
              </select>
              {(form.config.sortOrder === "random" || !form.config.sortOrder) && <span id="lesson-sort-note" className="lesson-config-help">{text(
                "Chiều được chọn một lần khi bắt đầu lượt.",
                "The order is chosen once at the start of the attempt.",
              )}</span>}
            </label>}
            {collectionOperations.has(lesson.id) && <div>
              <span className="field-label">{text("Độ khó")}</span>
              <p className="lesson-config-fixed">{text("Một mức · Dễ", "Single level · Easy")}</p>
            </div>}
            {lesson.hasDifficultyPresets && !collectionOperations.has(lesson.id) && <label>
              <span className="field-label">{text("Độ khó bắt đầu tối thiểu", "Minimum starting difficulty")}</span>
              <select className="field" value={form.difficulty} aria-describedby="lesson-difficulty-note"
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {["Easy", "Medium", "Hard"].map((v) => (
                  <option key={v} value={v}>{text(difficultyLabels[v], v)}</option>
                ))}
              </select>
              <span id="lesson-difficulty-note" className="lesson-config-help">{text(
                "Có thể chơi mức cao hơn theo tiến độ.",
                "Higher levels are available as players progress.",
              )}</span>
            </label>}
          </div>
          {lesson.hasHints && <label className="lesson-config-check admin-check-option">
            <input type="checkbox" checked={form.config.hintsAllowed}
              onChange={(e) => config("hintsAllowed", e.target.checked)} />
            {text("Hiện gợi ý bước tiếp theo khi làm sai hoặc hết giờ", "Show a next-step hint after a mistake or timeout")}
          </label>}
        </section>

        <section className="panel lesson-config-card" aria-labelledby="lesson-timing-title">
          <div className="lesson-config-card-head">
            <span className="lesson-config-icon" aria-hidden="true"><Clock3 size={19} /></span>
            <div>
              <h2 id="lesson-timing-title">{text("Thời gian thử thách", "Challenge timing")}</h2>
              <p>{mapStageTimes ? text(
                "Giới hạn riêng từng chặng áp dụng khi chơi trên bản đồ.",
                "Stage overrides apply to map challenges.",
              ) : hasTimeOverrides ? text(
                "Ưu tiên bài giao → mức hoặc chặng → giới hạn chung.",
                "Limit priority goes from assignment to level or stage to default.",
              ) : text(
                "Bài giao dùng giới hạn riêng nếu có.",
                "Assignments use their own limit when set.",
              )}</p>
            </div>
          </div>
          <label className="lesson-config-default-limit">
            <span className="field-label">{text("Giới hạn thời gian chung (giây)")}</span>
            <input className="field" type="number" min={10} max={86400} required value={timeLimit}
              onChange={(e) => config("timeLimit", e.target.value === "" ? "" : Number(e.target.value))} />
          </label>
          {hasTimeOverrides && <fieldset className="lesson-config-overrides" aria-describedby="lesson-overrides-note">
            <legend className="field-label">{usesStages ? text("Giới hạn theo chặng (giây)", "Time limits by stage (seconds)")
              : text("Giới hạn theo độ khó (giây)", "Time limits by difficulty (seconds)")}</legend>
            <div className="lesson-config-override-grid">
              {["Easy", "Medium", "Hard"].map((difficulty, index) => {
                const key = difficulty.toLowerCase();
                const limit = overrides[key];
                return <div key={key}>
                  <label className="field-label" htmlFor={`lesson-time-${key}`}>{usesStages ? text(`Chặng ${index + 1}`, `Stage ${index + 1}`)
                    : text(difficultyLabels[difficulty], difficulty)}</label>
                  <input id={`lesson-time-${key}`} className="field" type="number" min={10} max={86400}
                    aria-describedby={`lesson-time-${key}-source`} value={limit ?? ""}
                    onChange={(event) => {
                      const next = { ...overrides };
                      if (event.target.value === "") delete next[key];
                      else next[key] = Number(event.target.value);
                      config("timeLimitsByDifficulty", next);
                    }} />
                  <span id={`lesson-time-${key}-source`} className="lesson-config-help">
                    {limit == null ? defaultLimitLabel : text("Giới hạn riêng", "Override")}
                  </span>
                </div>;
              })}
            </div>
            <p id="lesson-overrides-note" className="lesson-config-help">{text(
              "Để trống để dùng giới hạn chung.",
              "Leave blank to use the default limit.",
            )}</p>
          </fieldset>}
        </section>

        <div className="lesson-config-actions">
          <button type="button" className="btn-secondary" onClick={() => setForm(structuredClone(lesson))}>
            <RotateCcw size={16} aria-hidden="true" />{text("Hoàn tác")}
          </button>
          <button type="submit" className="btn-primary">
            <Save size={16} aria-hidden="true" />{isSaving ? text("Đang lưu…") : text("Lưu cấu hình")}
          </button>
        </div>
      </fieldset>
      <LessonScoringRules />
    </form>
  );
}
