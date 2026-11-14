import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { saveBlob } from "../../../api/apiClient";
import { getPlatformSettings, getPortalExport, updatePlatformSettings } from "./platformSettingsService";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import Appearance from "../../../preferences/Appearance";
import { AdminPageHeader } from "../AdminPageHeader";
export default function PlatformSettingsPage() {
  const text = useText();
  const state = useApiData(getPlatformSettings, null);
  const [draft, setDraft] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = state.data && { ...state.data, ...draft };

  function updateField(name, value) {
    setDraft((previous) => ({ ...previous, [name]: value }));
  }
  const [message, setMessage] = useState("");
  async function save(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");
    setActionError("");
    try {
      state.setData(await updatePlatformSettings(form));
      setDraft((current) => (current === draft ? null : current));
      setMessage(text("Đã lưu cài đặt."));
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  async function download() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      const data = await getPortalExport();
      saveBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        "portal-export.json",
      );
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader title="Settings" />
      <div className="mb-6"><Appearance /></div>
      <ApiFeedback state={state} message={message} actionError={actionError} />
      {form && (
        <form onSubmit={save} className="panel space-y-6 p-6">
          <label className="block">
            <span className="field-label">{text("Tên nền tảng")}</span>
            <input
              className="field"
              required
              maxLength={100}
              value={form.platformName}
              onChange={(e) => updateField("platformName", e.target.value)}
            />
          </label>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="field-label">{text("Tên nhóm bài trong Unity", "Unity topic names")}</legend>
            {[["array", "Array"], ["linked", "Linked List"], ["stack", "Stack"], ["queue", "Queue"], ["tree", "Tree"], ["graph", "Graph"]].map(([id, name]) =>
              <label key={id}><span className="field-label">{name}</span>
                <input className="field" maxLength={100} placeholder={name} value={form.topicNames?.[id] ?? ""}
                  onChange={(event) => {
                    const names = { ...form.topicNames, [id]: event.target.value };
                    if (!event.target.value.trim()) delete names[id];
                    updateField("topicNames", names);
                  }} />
              </label>)}
          </fieldset>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.maintenance}
              onChange={(e) => updateField("maintenance", e.target.checked)}
            />
            {text("Bật cờ bảo trì cho client học tập")}
          </label>
          <p className="text-sm text-slate-500">
            {text("Khi bật bảo trì, Unity tạm dừng truy cập màn chơi sau khi đồng bộ. Portal vẫn mở cho quản trị viên.")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" disabled={isSubmitting}>
              {text("Lưu cài đặt")}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={isSubmitting}
              onClick={download}
            >
              {text("Xuất dữ liệu portal (JSON)")}
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            {text("Tệp xuất gồm danh sách tài khoản, lớp và thống kê; không phải bản sao lưu toàn bộ database hoặc nội dung tệp tài liệu.")}
          </p>
        </form>
      )}
    </div>
  );
}
