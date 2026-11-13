import { useState } from "react";
import { Link } from "react-router-dom";
import { listUsers, saveMyProfile, saveUser } from "./userService";
import { useAuth } from "../../../auth/useAuth";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import UserForm from "./UserForm";
import UserList from "./UserList";

const INITIAL_USER_FORM = {
  email: "",
  name: "",
  password: "",
  role: "instructor",
  status: "Active",
};
export default function UserManagementPage() {
  const { user, updateSessionProfile } = useAuth();
  const state = useApiData(listUsers, []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const isOwnProfile = form?.id === user.id;
  const rows = state.data.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function save(event) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setMessage("");
    setActionError("");
    try {
      if (isOwnProfile) {
        const updated = await saveMyProfile(form);
        if (!(await updateSessionProfile(updated))) return;
      } else {
        await saveUser(form);
      }
      setForm((current) => (current === form ? null : current));
      await state.refresh();
      setMessage(isOwnProfile ? "Đã lưu hồ sơ cá nhân." : "Đã lưu tài khoản.");
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsSaving(false);
    }
  }
  const field = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="User Management">
        <Link className="btn-secondary" to="/admin/analytics#admin-activity">Nhật ký hoạt động</Link>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ ...INITIAL_USER_FORM });
            setMessage("");
          }}
        >
          + Thêm tài khoản
        </button>
      </AdminPageHeader>
      <ApiFeedback state={state} message={message} actionError={actionError} />
      {form && (
        <UserForm
          form={form}
          isOwnProfile={isOwnProfile}
          isSaving={isSaving}
          showDeactivatedStatus={
            form.status === "Deactive" ||
            state.data.some((user) => user.id === form.id && user.status === "Deactive")
          }
          onSubmit={save}
          onFieldChange={field}
          onCancel={() => setForm(null)}
        />
      )}
      <UserList
        rows={rows}
        currentUserId={user.id}
        query={query}
        role={role}
        onQueryChange={setQuery}
        onRoleChange={setRole}
        onEdit={(account) => {
          setForm({ ...account });
          setActionError("");
          setMessage("");
        }}
      />
    </div>
  );
}
