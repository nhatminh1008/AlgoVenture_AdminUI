import { useText } from "../../../preferences/preferencesContext";
import { Lock, Pencil } from "lucide-react";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import RecordBadge from "../RecordBadge";
import { roleLabels, statusLabels } from "../recordLabels.js";

const accountStatusDescriptions = {
  Active: "Có thể đăng nhập.",
  Suspended: "Tạm thời bị chặn đăng nhập.",
  Deactive: "Đã vô hiệu hóa, lịch sử tài khoản vẫn được lưu.",
};

export default function UserList({ rows, currentUserId, query, role, onQueryChange, onRoleChange, disabled, onEditOwnProfile, onLock }) {
  const text = useText();
  const pagination = usePagination(rows, query + role);
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap gap-3 p-5">
        <input
          aria-label={text("Tìm tài khoản")}
          className="field flex-1"
          placeholder={text("Tìm theo tên hoặc email…")}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <select
          aria-label={text("Lọc vai trò")}
          className="field sm:w-48"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="all">{text("Tất cả vai trò")}</option>
          {["admin", "instructor", "learner"].map((v) => (
            <option key={v} value={v}>{text(roleLabels[v])}</option>
          ))}
        </select>
      </div>
      <details className="px-5 pb-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium">{text("Ý nghĩa trạng thái")}</summary>
        <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {Object.entries(accountStatusDescriptions).map(([value, description]) => (
            <div key={value}>
              <dt className="font-semibold">{text(statusLabels[value])}</dt>
              <dd>{text(description)}</dd>
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
                  <th key={v}>{text(v)}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><RecordBadge value={u.role} role /></td>
                <td><RecordBadge value={u.status} /></td>
                <td>
                  {u.id === currentUserId ? (
                    <button type="button" className="btn-row-action" disabled={disabled} onClick={() => onEditOwnProfile(u)}>
                      <Pencil aria-hidden="true" />
                      {text("Sửa hồ sơ của tôi")}
                    </button>
                  ) : u.status === "Active" && (
                    <button type="button" className="btn-row-action btn-row-action-danger" disabled={disabled} onClick={() => onLock(u)}>
                      <Lock aria-hidden="true" />
                      {text("Tạm khóa", "Suspend")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>{text("Không có tài khoản phù hợp.")}</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} />
      </div>
    </section>
  );
}
