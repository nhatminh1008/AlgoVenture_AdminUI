import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
export default function LevelConfig() {
  const state = useApiData("/admin/algorithms", []);
  const [params, setParams] = useSearchParams();
  const selected =
    state.data.find((a) => a.id === params.get("lessonId")) || state.data[0];
  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader title="Level Configuration" />
      <ApiFeedback state={state} />
      <label className="mb-6 block">
        <span className="field-label">Chọn bài học</span>
        <select
          className="field"
          value={selected?.id || ""}
          onChange={(e) => setParams({ lessonId: e.target.value })}
        >
          {state.data.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.topicId})
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <Editor
          key={selected.id}
          lesson={selected}
          lessons={state.data}
          onSaved={state.setData}
        />
      )}
    </div>
  );
}
function Editor({ lesson, lessons, onSaved }) {
  const [form, setForm] = useState(() => structuredClone(lesson));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function config(key, value) {
    setForm((previous) => ({
      ...previous,
      config: { ...previous.config, [key]: value },
    }));
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const rows = await api(`/admin/algorithms/${lesson.id}`, {
        method: "PUT",
        body: form,
      });
      onSaved(rows);
      setMessage("Đã lưu cấu hình.");
      setError("");
    } catch (f) {
      setError(f.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="panel space-y-6 p-6">
      <h2 className="text-xl font-bold">{lesson.name}</h2>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">Tên hiển thị</span>
          <input
            className="field"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          <span className="field-label">Độ khó</span>
          <select
            className="field"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            {["Easy", "Medium", "Hard"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Trạng thái</span>
          <select
            className="field"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {["Draft", "Published"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Giới hạn thời gian (giây)</span>
          <input
            className="field"
            type="number"
            min={10}
            max={86400}
            required
            value={form.config.timeLimit}
            onChange={(e) => config("timeLimit", Number(e.target.value))}
          />
        </label>
      </div>
      <fieldset>
        <legend className="field-label">Ngưỡng điểm sao (tăng dần)</legend>
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
      </fieldset>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.config.hintsAllowed}
          onChange={(e) => config("hintsAllowed", e.target.checked)}
        />
        Cho phép gợi ý
      </label>
      <fieldset>
        <legend className="field-label">Bài tiên quyết</legend>
        <div className="grid max-h-56 gap-2 overflow-auto sm:grid-cols-2">
          {lessons
            .filter((a) => a.id !== lesson.id)
            .map((a) => (
              <label className="flex items-center gap-2 text-sm" key={a.id}>
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
      </fieldset>
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu cấu hình"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => {
            setForm(structuredClone(lesson));
            setError("");
            setMessage("");
          }}
        >
          Hoàn tác
        </button>
      </div>
    </form>
  );
}
