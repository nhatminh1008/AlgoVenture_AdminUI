import { useState } from "react";
import { api } from "../api/client";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
export default function FeatureToggles() {
  const state = useApiData("/admin/features", []);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function toggle(feature) {
    setBusy(feature.id);
    setMessage("");
    try {
      state.setData(
        await api(`/admin/features/${feature.id}`, {
          method: "PUT",
          body: { enabled: !feature.enabled },
        }),
      );
      state.setError("");
      setMessage("Đã lưu cấu hình tính năng.");
    } catch (failure) {
      state.setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeader title="Feature Toggles" />
      <ApiFeedback state={state} message={message} />
      <p className="mb-5 text-sm text-slate-500">
        Cấu hình được lưu trên server. Game và adaptive service cần đọc API cấu
        hình khi tích hợp.
      </p>
      <div className="space-y-5">
        {["Learning", "Social", "System"].map((category) => (
          <section className="panel p-6" key={category}>
            <h2 className="mb-3 text-lg font-bold">{category}</h2>
            {state.data
              .filter((f) => f.category === category)
              .map((f) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0"
                  key={f.id}
                >
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {f.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={f.enabled}
                    aria-label={f.title}
                    disabled={!!busy}
                    className={`relative h-6 w-11 shrink-0 rounded-full ${f.enabled ? "bg-emerald-600" : "bg-slate-300"}`}
                    onClick={() => toggle(f)}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white ${f.enabled ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
