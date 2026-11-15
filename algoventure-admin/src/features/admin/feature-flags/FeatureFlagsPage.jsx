import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { listFeatureFlags, updateFeatureFlag } from "./featureFlagService";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
const effects = {
  adaptive: ["Gợi ý bài luyện dựa trên kết quả trước đó.", "Recommend practice based on previous performance."],
  sandbox: ["Cho phép mở mô phỏng với dữ liệu tùy chỉnh.", "Open the simulator with custom input."],
  xp: ["Hiển thị điểm thưởng trong game.", "Show game reward points."],
  practice: ["Cho phép mở phần luyện tập.", "Allow access to practice."],
  leaderboard: ["Cho phép xem bảng xếp hạng.", "Allow access to the leaderboard."],
  badges: ["Hiển thị huy hiệu trong hồ sơ người chơi.", "Show badges in player profiles."],
  offline: ["Cho phép mở lại màn đã lưu khi mất kết nối.", "Allow cached levels when the connection drops."],
  bilingual: ["Cho phép chọn VN hoặc EN trong Unity.", "Allow VN and EN selection in Unity."],
};

export default function FeatureFlagsPage() {
  const text = useText();
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
      setMessage(feature.enabled ? text("Tính năng đã tắt.") : text("Tính năng đã bật."));
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
        {text("Unity kiểm tra các thay đổi khi mở game, khi quay lại cửa sổ và định kỳ khi đang chơi.", "Unity checks for changes on launch, on focus, and periodically during play.")}
      </p>
      <div className="space-y-5">
        {["Learning", "Social", "System"].map((category) => (
          <section className="admin-feature-panel panel p-6" key={category}>
            <h2 className="mb-3 text-lg font-bold">{text({ Learning: "Học tập", Social: "Cộng đồng", System: "Hệ thống" }[category])}</h2>
            {state.data
              .filter((f) => f.category === category)
              .map((f) => (
                <div
                  className="admin-feature-row flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0"
                  key={f.id}
                >
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {effects[f.id] ? text(...effects[f.id]) : f.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={f.enabled}
                    aria-label={f.title}
                    disabled={!!updatingFeatureId}
                    className="admin-feature-switch"
                    onClick={() => toggle(f)}
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
