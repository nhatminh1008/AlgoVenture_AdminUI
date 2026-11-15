import { useText } from "../../../preferences/preferencesContext";
import { Eye, Lock, Pencil } from "lucide-react";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import RecordBadge from "../RecordBadge";
import { roleLabels, statusLabels } from "../recordLabels.js";

const accountStatusDescriptions = {
  Active: "Có thể đăng nhập.",
  Suspended: "Tạm thời bị chặn đăng nhập.",
  Deactive: "Đã vô hiệu hóa, lịch sử tài khoản vẫn được lưu.",
};

export default function UserList({ rows, currentUserId, query, role, onQueryChange, onRoleChange, isSaving, onOpen, onLock }) {
  const text = useText();
  const pagination = usePagination(rows, query + role);
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap gap-3 p-5">
        <input
          aria-label={text("Tìm tài khoản")}
          className="field flex-1"
          placeholder={text("Tìm theo tên, email hoặc tên đăng nhập…", "Search by name, email, or username…")}
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
<<<<<<< Updated upstream
                  <div className="table-actions">
                    <button type="button" className="btn-row-action" onClick={() => onOpen(u)}>
                      {u.id === currentUserId ? <Pencil aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      {u.id === currentUserId ? text("Sửa hồ sơ của tôi") : text("Xem", "View")}
                    </button>
                    {u.id !== currentUserId && u.status === "Active" && (
                      <button type="button" className="btn-row-action btn-row-action-danger"
                        onClick={() => onLock(u)} disabled={isSaving}>
                        <Lock aria-hidden="true" />{text("Khóa", "Lock")}
                      </button>
                    )}
                  </div>
=======
                  <button
                    type="button"
                    className="btn-row-action"
                    onClick={() => onEdit(u)}
                  >
                    <Pencil aria-hidden="true" />
                    {u.id === currentUserId ? text("Sửa hồ sơ của tôi") : text("Chỉnh sửa và phân quyền", "Edit account and role")}
                  </button>
>>>>>>> Stashed changes
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
