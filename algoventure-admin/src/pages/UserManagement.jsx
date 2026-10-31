import { useState } from "react";
import { api } from "../api/client";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
const empty = {
  email: "",
  name: "",
  password: "",
  role: "instructor",
  status: "Active",
};
export default function UserManagement() {
  const state = useApiData("/admin/users", []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const rows = state.data.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api(`/admin/users${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST",
        body: form,
      });
      setForm(null);
      await state.refresh();
      setMessage("Đã lưu tài khoản.");
    } catch (failure) {
      state.setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));
  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader title="User Management">
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ ...empty });
            setMessage("");
          }}
        >
          + Thêm tài khoản
        </button>
      </AdminHeader>
      <ApiFeedback state={state} message={message} />
      {form && (
        <form onSubmit={save} className="panel mb-6 space-y-4 p-6">
          <h2 className="text-lg font-bold">
            {form.id ? "Sửa tài khoản" : "Tạo tài khoản"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Họ tên</span>
              <input
                className="field"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Email</span>
              <input
                className="field"
                required
                type="email"
                maxLength={254}
                disabled={!!form.id}
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
              />
            </label>
            {!form.id && (
              <label>
                <span className="field-label">Mật khẩu (10–72 ký tự)</span>
                <input
                  className="field"
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={72}
                  value={form.password}
                  onChange={(e) => field("password", e.target.value)}
                />
              </label>
            )}
            <label>
              <span className="field-label">Vai trò</span>
              <select
                className="field"
                value={form.role}
                onChange={(e) => field("role", e.target.value)}
              >
                {["admin", "instructor", "learner"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Trạng thái</span>
              <select
                className="field"
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
              >
                {["Active", "Pending", "Suspended"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu tài khoản"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setForm(null)}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap gap-3 p-5">
          <input
            aria-label="Tìm tài khoản"
            className="field flex-1"
            placeholder="Tìm theo tên hoặc email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Lọc vai trò"
            className="field sm:w-48"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            {["admin", "instructor", "learner"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {["Họ tên", "Email", "Vai trò", "Trạng thái", "Thao tác"].map(
                  (v) => (
                    <th key={v}>{v}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td>
                    <button
                      className="text-emerald-700"
                      onClick={() => setForm({ ...u })}
                    >
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5}>Không có tài khoản phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
