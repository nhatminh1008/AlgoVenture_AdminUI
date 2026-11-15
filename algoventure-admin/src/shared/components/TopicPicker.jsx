import { useText } from "../../preferences/preferencesContext";

export function TopicPicker({ topics, value, onChange, disabled = false }) {
  const text = useText();

  return (
    <fieldset disabled={disabled}>
      <legend className="field-label">{text("Cấu trúc dữ liệu", "Data structures")}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {topics.map(({ id, label }) => (
          <label key={id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${value.includes(id) ? "border-portal-line-strong bg-portal-lavender/60" : "border-slate-200"}`}>
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-portal-purple"
              checked={value.includes(id)}
              onChange={(event) => onChange(event.target.checked ? [...value, id] : value.filter((topicId) => topicId !== id))}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
