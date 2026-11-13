import { useState } from "react";
import { listFeatureFlags, updateFeatureFlag } from "./featureFlagService";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
export default function FeatureFlagsPage() {
  const state = useApiData(listFeatureFlags, []);
  const [updatingFeatureId, setUpdatingFeatureId] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  async function toggle(feature) {
    if (updatingFeatureId) return;
    setUpdatingFeatureId(feature.id);
    setMessage("");
    setActionError("");
    try {
      state.setData(await updateFeatureFlag(feature.id, !feature.enabled));
      setMessage("Đã lưu cấu hình tính năng.");
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setUpdatingFeatureId("");
    }
  }
  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader title="Feature Toggles" />
      <ApiFeedback state={state} message={message} actionError={actionError} />
      <p className="mb-5 text-sm text-slate-500">
        Game nhận thay đổi khi mở hoặc quay lại tab, và kiểm tra lại định kỳ khi đang mở.
      </p>
      <div className="space-y-5">
        {["Learning", "Social", "System"].map((category) => (
          <section className="panel p-6" key={category}>
            <h2 className="mb-3 text-lg font-bold">{{ Learning: "Học tập", Social: "Cộng đồng", System: "Hệ thống" }[category]}</h2>
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
                    disabled={!!updatingFeatureId}
                    className={`relative h-6 w-11 shrink-0 rounded-full ${f.enabled ? "bg-portal-purple" : "bg-slate-300"}`}
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
