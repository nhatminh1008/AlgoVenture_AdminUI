import { useText } from "../../../preferences/preferencesContext";
import { difficultyLabels } from "../recordLabels.js";
import { sortingLessons } from "../../../shared/curriculum/sortOrder.js";
import { collectionOperations } from "../../../shared/curriculum/collectionLessons.js";
import { useState } from "react";
import { updateLesson } from "./lessonService";
import { validateInsertionScoring } from "./scoringConfiguration.js";

export default function LessonConfigurationForm({ lesson, onSaved }) {
  const text = useText();
  const [form, setForm] = useState(() => structuredClone(lesson));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
    const validation = validateInsertionScoring(form.scoring, form.config.starThresholds);
    if (validation) {
      setMessage("");
      setError(validation === "coefficients"
        ? text("Hệ số điểm hoặc điểm phạt nằm ngoài giới hạn.", "Scoring coefficients are outside the allowed range.")
        : text("Cần ba ngưỡng sao tăng dần từ 1 đến 1.280.000.", "Use three strictly increasing star thresholds between 1 and 1,280,000."));
      return;
    }
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const { name, difficulty, status } = form;
      const rows = await updateLesson(lesson.id, {
        name, difficulty, status,
        ...(form.scoring && { scoring: {
          pointsPerStep: form.scoring.pointsPerStep,
          penaltyPerError: form.scoring.penaltyPerError,
        } }),
        config: { ...form.config, prerequisites: form.config.prerequisites.filter((id) => !required.includes(id)) },
      });
      onSaved(rows);
      const saved = rows.find((row) => row.id === lesson.id);
      if (saved) setForm(structuredClone(saved));
      setMessage(text("Đã lưu cấu hình."));
    } catch (f) {
      setError(f.message);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="admin-form panel space-y-6 p-6">
      <h2 className="text-xl font-bold">{text(lesson.name)}</h2>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-portal-purple-strong">
          {message}
        </p>
      )}
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
          <span id="lesson-time-label" className="field-label">{text("Giới hạn thời gian (giây)")}</span>
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
      {form.scoring && <fieldset className="space-y-3">
        <legend className="field-label">{text("Hệ số điểm Insertion Sort", "Insertion Sort scoring coefficients")}</legend>
        <p className="text-sm text-portal-muted">
          {text("Unity hiển thị điểm và sao do Backend xác nhận cho lượt có nhật ký hợp lệ.",
            "Unity displays Backend-confirmed scores and stars for attempts with verified logs.")}
        </p>
        <dl className="text-sm">
          <dt>{text("Phiên bản", "Version")}</dt>
          <dd>{form.scoring.version ?? text("Mặc định", "Default")}</dd>
          {form.scoring.updatedAt && <>
            <dt>{text("Ngày cập nhật", "Updated at")}</dt>
            <dd><time dateTime={form.scoring.updatedAt}>{new Date(form.scoring.updatedAt).toLocaleString()}</time></dd>
          </>}
          {form.scoring.updatedBy && <>
            <dt>{text("ID người cập nhật", "Updated by (ID)")}</dt>
            <dd>{form.scoring.updatedBy}</dd>
          </>}
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["pointsPerStep", text("Điểm mỗi bước hợp lệ", "Points per valid move"), 1],
            ["penaltyPerError", text("Điểm trừ mỗi lỗi", "Penalty per error"), 0],
          ].map(([key, label, minimum]) => (
            <label key={key}>
              <span className="field-label">{label}</span>
              <input className="field" type="number" min={minimum} max={10000} required value={form.scoring[key]}
                onChange={(event) => setForm((previous) => ({
                  ...previous, scoring: { ...previous.scoring, [key]: Number(event.target.value) },
                }))} />
            </label>
          ))}
        </div>
      </fieldset>}
      {lesson.hasScoreThresholds && <fieldset>
        <legend className="field-label">{text("Ngưỡng điểm sao (tăng dần)")}</legend>
        <p className="mb-3 text-sm text-portal-muted">
          {text("Game dùng điểm trên màn kết quả để xét sao. Điểm dưới ngưỡng đầu tiên được 0 sao.",
            "The game awards stars from the score shown on the results screen. Scores below the first threshold earn zero stars.")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {form.config.starThresholds.map((value, i) => (
            <label key={i}>
              <span className="field-label">{text(`${i + 1} sao`, i === 0 ? "1 star" : `${i + 1} stars`)}</span>
              <input
                className="field"
                type="number"
                min={1}
                max={form.scoring ? 1280000 : undefined}
                required
                value={value}
                onChange={(e) =>
                  config(
                    "starThresholds",
                    form.config.starThresholds.map((v, n) =>
                      n === i ? Number(e.target.value) : v,
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>
      </fieldset>}
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
            setError("");
            setMessage("");
          }}
        >
          {text("Hoàn tác")}
        </button>
      </div>
    </form>
  );
}
