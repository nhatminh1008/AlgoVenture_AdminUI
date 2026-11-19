import { Check, Pause } from "lucide-react";

import { useActionToast } from "../../../shared/components/useActionToast";
import { useState } from "react";
import { useText } from "../../../preferences/preferencesContext";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import { listAchievements, setAchievementEnabled } from "./achievementService.js";

const art = import.meta.glob("./art/medal-*-v2.png", { eager: true, query: "?url", import: "default" });
const groups = {
  journey: ["Hành trình", "Journey"],
  topics: ["Chủ đề học tập", "Learning topics"],
  streaks: ["Chuỗi ngày chơi", "Streaks"],
  classroom: ["Lớp học", "Classroom"],
  practice: ["Luyện tập", "Practice"],
};

export default function AchievementRulesPage() {
  const text = useText();
  const toast = useActionToast();
  const rules = useApiDataWithErrorToast(listAchievements, []);
  const [savingId, setSavingId] = useState("");

  async function toggle(rule) {
    if (savingId) return;
    setSavingId(rule.id);
    try {
      const updated = await setAchievementEnabled(rule.id, !rule.enabled);
      rules.setData((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      toast(updated.enabled
        ? text("Đã cho phép nhận thành tựu.", "Achievement can now be earned.")
        : text("Đã tắt khả năng nhận thành tựu.", "Achievement can no longer be earned."));
    } catch (failure) {
      toast(failure.message, true);
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader title={text("Thành tựu", "Achievements")} />
      <ApiFeedback state={rules} />
      <section className="admin-feature-panel panel p-6">
        <h2 className="text-lg font-bold">{text("Danh mục thành tựu", "Achievement catalog")}</h2>
        <p className="mt-1 text-sm text-portal-muted">
          {text("Bật hoặc tắt khả năng nhận từng thành tựu. Người chơi giữ các thành tựu đã nhận.",
            "Control which achievements players can earn. Players keep achievements they have already earned.")}
        </p>
        {Object.entries(groups).map(([group, labels]) => {
          const items = rules.data.filter((rule) => (rule.group ?? "journey") === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="mt-5">
              <h3 className="text-base font-semibold">{text(...labels)}</h3>
              <ul className="mt-1">
                {items.map((rule) => {
                  const name = text(rule.name, rule.englishName);
                  const medal = art[`./art/medal-${rule.id}-v2.png`];
                  return (
                    <li key={rule.id} className="admin-feature-row flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        {medal && <img src={medal} alt="" width="56" height="56" loading="lazy" decoding="async" className="size-12 shrink-0 object-contain sm:size-14" />}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h4 className="font-semibold">{name}</h4>
                            <span className="achievement-status" data-paused={!rule.enabled || undefined}>
                              {rule.enabled ? <Check size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
                              {rule.enabled ? text("Có thể nhận", "Available") : text("Tạm ngưng trao", "Awards paused")}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-portal-muted">{text(rule.description, rule.englishDescription)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={rule.enabled}
                        aria-label={text(`Cho phép nhận ${name}`, `Allow earning ${name}`)}
                        disabled={Boolean(savingId)}
                        className="admin-feature-switch shrink-0"
                        onClick={() => toggle(rule)}
                      >
                        <span aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </section>
    </main>
  );
}
