import { useState } from "react";
import { api, saveBlob } from "../api/client";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
export default function Settings() {
  const state = useApiData("/admin/settings", null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      state.setData(
        await api("/admin/settings", { method: "PUT", body: state.data }),
      );
      state.setError("");
      setMessage("Đã lưu cài đặt.");
    } catch (f) {
      state.setError(f.message);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    try {
      const data = await api("/admin/export");
      saveBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        "portal-export.json",
      );
    } catch (f) {
      state.setError(f.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <AdminHeader title="Settings" />
      <ApiFeedback state={state} message={message} />
      {state.data && (
        <form onSubmit={save} className="panel space-y-6 p-6">
          <label className="block">
            <span className="field-label">Tên nền tảng</span>
            <input
              className="field"
              required
              maxLength={100}
              value={state.data.platformName}
              onChange={(e) =>
                state.setData({ ...state.data, platformName: e.target.value })
              }
            />
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={state.data.maintenance}
              onChange={(e) =>
                state.setData({ ...state.data, maintenance: e.target.checked })
              }
            />
            Bật cờ bảo trì cho client học tập
          </label>
          <p className="text-sm text-slate-500">
            Cờ được lưu để game sử dụng khi tích hợp. Quản trị viên vẫn có thể
            truy cập portal.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" disabled={busy}>
              Lưu cài đặt
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={download}
            >
              Xuất dữ liệu portal (JSON)
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Tệp xuất gồm danh sách tài khoản, lớp và thống kê; không phải bản
            sao lưu toàn bộ database hoặc nội dung tệp tài liệu.
          </p>
        </form>
      )}
    </div>
  );
}
