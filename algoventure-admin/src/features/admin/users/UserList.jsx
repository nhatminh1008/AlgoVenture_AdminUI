import { useText } from "../../../preferences/preferencesContext";
import { Eye, Lock, LockOpen, Pencil } from "lucide-react";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import RecordTable from "../../../shared/components/RecordTable";
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
  const columns = [
    { key: "name", title: text("Họ tên"), layout: "primary", render: (user) => user.name },
    { key: "email", title: text("Email"), layout: "secondary", render: (user) => user.email },
    { key: "role", title: text("Vai trò"), render: (user) => <RecordBadge value={user.role} role /> },
    { key: "status", title: text("Trạng thái"), render: (user) => <RecordBadge value={user.status} /> },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (user) => (
        <div className="table-actions">
          <button type="button" className="btn-row-action" onClick={() => onOpen(user)}>
            {user.id === currentUserId ? <Pencil aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {user.id === currentUserId
              ? text("Sửa hồ sơ của tôi")
              : user.role === "admin" ? text("Xem tài khoản", "View account") : text("Xem và phân quyền", "View account and role")}
          </button>
          {user.id !== currentUserId && user.status === "Active" && (
            <button type="button" className="btn-row-action btn-row-action-danger"
              onClick={() => onLock(user, true)} disabled={isSaving}>
              <Lock aria-hidden="true" />{text("Khóa", "Lock")}
            </button>
          )}
          {user.id !== currentUserId && user.status === "Suspended" && (
            <button type="button" className="btn-row-action"
              onClick={() => onLock(user, false)} disabled={isSaving}>
              <LockOpen aria-hidden="true" />{text("Mở khóa", "Unlock")}
            </button>
          )}
        </div>
      ),
    },
  ];
  return (
    <section className="panel overflow-hidden">
      <div className="admin-table-filters flex flex-wrap gap-3 p-5">
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
      <details className="admin-table-help px-5 pb-4 text-sm text-slate-600">
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
      <RecordTable label={text("Tài khoản")} columns={columns} rows={pagination.items}
        emptyMessage={text("Không có tài khoản phù hợp.")} />
      <Pagination pagination={pagination} />
    </section>
  );
}
