import RecordBadge from "../RecordBadge";
import { roleLabels, statusLabels } from "../recordLabels.js";

const accountStatusDescriptions = {
  Active: "Có thể đăng nhập.",
  Pending: "Chưa được kích hoạt.",
  Suspended: "Tạm thời bị chặn đăng nhập.",
  Deactive: "Đã vô hiệu hóa, lịch sử tài khoản vẫn được lưu.",
};

export default function UserList({ rows, currentUserId, query, role, onQueryChange, onRoleChange, onEdit }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap gap-3 p-5">
        <input
          aria-label="Tìm tài khoản"
          className="field flex-1"
          placeholder="Tìm theo tên hoặc email…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <select
          aria-label="Lọc vai trò"
          className="field sm:w-48"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="all">Tất cả vai trò</option>
          {["admin", "instructor", "learner"].map((v) => (
            <option key={v} value={v}>{roleLabels[v]}</option>
          ))}
        </select>
      </div>
      <details className="px-5 pb-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium">Ý nghĩa trạng thái</summary>
        <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {Object.entries(accountStatusDescriptions).map(([value, description]) => (
            <div key={value}>
              <dt className="font-semibold">{statusLabels[value]}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </details>
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
                <td><RecordBadge value={u.role} role /></td>
                <td><RecordBadge value={u.status} /></td>
                <td>
                  <button
                    className="text-portal-purple-strong"
                    onClick={() => onEdit(u)}
                  >
                    {u.id === currentUserId ? "Sửa hồ sơ của tôi" : "Chỉnh sửa"}
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
  );
}
