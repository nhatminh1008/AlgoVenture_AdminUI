import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { updateLesson } from "./lessonService";

export default function LessonConfigurationForm({ lesson, lessons, onSaved }) {
  const text = useText();
  const [form, setForm] = useState(() => structuredClone(lesson));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const required = lesson.requiredPrerequisites ?? [];
  const prerequisites = usePagination(
    lessons.filter((item) => item.id !== lesson.id && !required.includes(item.id)), lesson.id,
  );
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
    setMessage("");
    setError("");
    try {
      const { name, difficulty, status } = form;
      const rows = await updateLesson(lesson.id, {
        name, difficulty, status,
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
      <h2 className="text-xl font-bold">{lesson.name}</h2>
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
        {lesson.hasDifficultyPresets && <label>
          <span id="lesson-difficulty-label" className="field-label">{text("Độ khó bắt đầu tối thiểu", "Minimum starting difficulty")}</span>
          <select
            className="field"
            value={form.difficulty}
            aria-labelledby="lesson-difficulty-label"
            aria-describedby="lesson-difficulty-note"
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            {["Easy", "Medium", "Hard"].map((v) => (
              <option key={v} value={v}>{text({ Easy: "Dễ", Medium: "Vừa", Hard: "Khó" }[v], v)}</option>
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
      {lesson.hasScoreThresholds && <fieldset>
        <legend className="field-label">{text("Ngưỡng điểm sao (tăng dần)")}</legend>
        <p className="mb-3 text-sm text-portal-muted">
          {text("Game dùng điểm trên màn kết quả để xét sao. Điểm dưới ngưỡng đầu tiên được 0 sao.",
            "The game awards stars from the score shown on the results screen. Scores below the first threshold earn zero stars.")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {form.config.starThresholds.map((value, i) => (
            <label key={i}>
              <span className="field-label">{i + 1} sao</span>
              <input
                className="field"
                type="number"
                min={1}
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
      <fieldset>
        <legend className="field-label">{text("Bài tiên quyết bổ sung", "Additional prerequisites")}</legend>
        {required.length > 0 && <p className="mb-3 text-sm text-portal-muted">
          {text("Bắt buộc theo lộ trình", "Required by the learning path")}{" · "}
          {required.map((id) => lessons.find((item) => item.id === id)?.name ?? id).join(", ")}
        </p>}
        <div className="grid max-h-56 gap-2 overflow-auto sm:grid-cols-2">
          {prerequisites.items.map((a) => (
              <label className="admin-check-option flex items-center gap-2 text-sm" key={a.id}>
                <input
                  type="checkbox"
                  checked={form.config.prerequisites.includes(a.id)}
                  onChange={(e) =>
                    config(
                      "prerequisites",
                      e.target.checked
                        ? [...form.config.prerequisites, a.id]
                        : form.config.prerequisites.filter((id) => id !== a.id),
                    )
                  }
                />
                {a.name}
              </label>
            ))}
        </div>
        <Pagination pagination={prerequisites} />
      </fieldset>
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
