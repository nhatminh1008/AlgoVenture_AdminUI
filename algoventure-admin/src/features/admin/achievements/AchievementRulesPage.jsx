import { useState } from "react";
import { useText } from "../../../preferences/preferencesContext";
import { useApiData } from "../../../shared/hooks/useApiData";
import { usePagination } from "../../../shared/hooks/usePagination";
import Pagination from "../../../shared/components/Pagination";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import { listLessons } from "../lessons/lessonService";
import { listAchievements, saveAchievement } from "./achievementService.js";

const initial = { name: "", description: "", icon: "first", lessonId: "", round: "", minimumScore: "", minimumStars: "", enabled: true };
const icons = { first: ["Bước đầu tiên", "First step"], region: ["Người chinh phục", "Conqueror"],
  streak: ["Bền bỉ", "Persistent"], all: ["Nhà khám phá", "Explorer"] };
const optionalNumber = (value) => value === "" || value == null ? null : Number(value);

export default function AchievementRulesPage() {
  const text = useText();
  const rules = useApiData(listAchievements, []);
  const lessons = useApiData(listLessons, []);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const page = usePagination(rules.data, "achievement-rules");
  const conditions = (rule) => [
    rule.lessonId && text(lessons.data.find((lesson) => lesson.id === rule.lessonId)?.name ?? rule.lessonId),
    rule.round && text(`Vòng ${rule.round}`, `Round ${rule.round}`),
    rule.minimumScore && text(`Từ ${rule.minimumScore} điểm`, `At least ${rule.minimumScore} points`),
    rule.minimumStars && text(`Từ ${rule.minimumStars} sao`, `At least ${rule.minimumStars} stars`),
  ].filter(Boolean).join(" · ");
  function edit(rule) {
    setError("");
    setNotice("");
    setDraft(rule ?? initial);
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setNotice("");
    if (!conditions(draft) || !draft.name.trim() || !draft.description.trim()) {
      setError(text("Nhập tên, mô tả và ít nhất một điều kiện.", "Enter a name, description and at least one condition."));
      return;
    }
    const { name, description, icon, enabled } = draft;
    const payload = { name, description, icon, enabled, lessonId: draft.lessonId || null,
      round: optionalNumber(draft.round), minimumScore: optionalNumber(draft.minimumScore),
      minimumStars: optionalNumber(draft.minimumStars) };
    setSaving(true);
    try {
      const saved = await saveAchievement(draft.id, payload);
      rules.setData((previous) => [saved, ...previous.filter((rule) => rule.id !== saved.id)]);
      setDraft(saved);
      setNotice(text("Đã lưu luật thành tựu.", "Achievement rule saved."));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  const bind = (key) => ({ value: draft[key] ?? "", onChange: (event) => setDraft({ ...draft, [key]: event.target.value }) });
  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader title={text("Thành tựu", "Achievements")} />
      <ApiFeedback state={rules} message={notice} actionError={error} />
      <ApiFeedback state={lessons} />
      <section className="panel p-6">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => edit()}>
          {text("Tạo luật thành tựu", "New achievement rule")}
        </button>
        <ul className="mt-4 space-y-3">
          {page.items.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <strong>{rule.name}</strong>
                <p className="text-sm text-portal-muted">{conditions(rule)}</p>
                <p className="text-sm">{rule.enabled ? text("Đang bật", "Enabled") : text("Đã tắt", "Disabled")}
                  {" · "}{text("Phiên bản", "Version")} {rule.version}</p>
              </div>
              <button type="button" className="btn-secondary" disabled={saving} onClick={() => edit(rule)}>
                {text("Chỉnh sửa", "Edit")}
              </button>
            </li>
          ))}
        </ul>
        <Pagination pagination={page} />
      </section>
      <form className="admin-form panel space-y-4 p-6" onSubmit={save}>
        <h2 className="text-xl font-bold">{draft.id ? text("Chỉnh sửa luật", "Edit rule") : text("Tạo luật", "New rule")}</h2>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label><span className="field-label">{text("Tên", "Name")}</span><input className="field" maxLength={100} required {...bind("name")} /></label>
          <label><span className="field-label">{text("Mô tả", "Description")}</span><input className="field" maxLength={255} required {...bind("description")} /></label>
          <label><span className="field-label">{text("Biểu tượng", "Icon")}</span>
            <select className="field" {...bind("icon")}>{Object.entries(icons).map(([key, label]) =>
              <option key={key} value={key}>{text(...label)}</option>)}</select>
          </label>
          <label><span className="field-label">{text("Bài học", "Lesson")}</span>
            <select className="field" {...bind("lessonId")}>
              <option value="">{text("Mọi bài đủ điều kiện", "Any eligible lesson")}</option>
              {lessons.data.map((lesson) => <option key={lesson.id} value={lesson.id}>{text(lesson.name)}</option>)}
            </select>
          </label>
          {[
            ["round", text("Vòng", "Round"), 3],
            ["minimumScore", text("Điểm tối thiểu", "Minimum score"), 1280000],
            ["minimumStars", text("Sao tối thiểu", "Minimum stars"), 3],
          ].map(([key, label, maximum]) => (
            <label key={key}><span className="field-label">{label}</span>
              <input className="field" type="number" min={1} max={maximum} {...bind(key)} />
            </label>
          ))}
          <label className="admin-check-option flex gap-3">
            <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
            {text("Bật luật", "Enable rule")}
          </label>
        </fieldset>
        <p className="text-sm text-portal-muted" aria-live="polite">
          {conditions(draft) || text("Chọn điều kiện để xem trước.", "Choose conditions to preview the rule.")}
        </p>
        <p className="text-sm text-portal-muted">{text("Luật áp dụng từ lúc cấp đề. Điều kiện điểm chỉ áp dụng cho các bài có điểm chính thức.",
          "Rules apply from issue time. Score requirements apply to lessons that award an official score.")}</p>
        <button className="btn-primary" disabled={saving}>{text("Lưu luật", "Save rule")}</button>
      </form>
    </main>
  );
}
