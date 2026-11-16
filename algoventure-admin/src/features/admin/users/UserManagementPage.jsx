import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { changeUserRole, createUser, listUsers, saveMyProfile, setUserLocked } from "./userService";
import { useAuth } from "../../../auth/useAuth";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import UserForm from "./UserForm";
import UserList from "./UserList";

const EDITABLE_ROLES = ["instructor", "learner"];

const INITIAL_USER_FORM = {
  email: "",
  name: "",
  password: "",
  role: "instructor",
  status: "Active",
};
export default function UserManagementPage() {
  const text = useText();
  const { user, updateSessionProfile } = useAuth();
  const state = useApiData(listUsers, []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const isOwnProfile = form?.id === user.id;
  const viewing = !!form?.id && !isOwnProfile;
  const savedAccount = viewing ? state.data.find((account) => account.id === form.id) : null;
  const canEditRole = EDITABLE_ROLES.includes(savedAccount?.role);
  const roleChanged = canEditRole && EDITABLE_ROLES.includes(form.role) && form.role !== savedAccount.role;
  const rows = state.data.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      `${u.name} ${u.email} ${u.username ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function save(event) {
    event.preventDefault();
    if (isSaving || (viewing && !roleChanged)) return;
    setIsSaving(true);
    setMessage("");
    setActionError("");
    try {
      if (isOwnProfile) {
        const updated = await saveMyProfile(form);
        if (!(await updateSessionProfile(updated))) return;
      } else if (viewing) {
        await changeUserRole(form);
      } else {
        await createUser(form);
      }
      setForm((current) => (current === form ? null : current));
      await state.refresh();
      setMessage(isOwnProfile ? text("Đã lưu hồ sơ cá nhân.") : text("Đã lưu tài khoản."));
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsSaving(false);
    }
  }
  async function changeLock(account, locked) {
    if (isSaving || !window.confirm(text(
      locked ? `Khóa tài khoản “${account.email}”? Người dùng sẽ bị đăng xuất.` : `Mở khóa tài khoản “${account.email}”?`,
      locked ? `Lock “${account.email}”? The user will be signed out.` : `Unlock “${account.email}”?`,
    ))) return;
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      await setUserLocked(account, locked);
      await state.refresh();
      setMessage(locked ? text("Đã khóa tài khoản.", "Account locked.") : text("Đã mở khóa tài khoản.", "Account unlocked."));
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
        <Link className="btn-secondary" to="/admin/analytics#admin-activity">{text("Nhật ký hoạt động")}</Link>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ ...INITIAL_USER_FORM });
            setMessage("");
            setActionError("");
          }}
        >
          {text("+ Thêm tài khoản")}
        </button>
      </AdminPageHeader>
      <ApiFeedback state={state} message={message} actionError={isOwnProfile ? undefined : actionError} />
      {form && (
        <UserForm
          form={form}
          isOwnProfile={isOwnProfile}
          viewing={viewing}
          editableRoles={canEditRole ? EDITABLE_ROLES : []}
          roleChanged={roleChanged}
          isSaving={isSaving}
          actionError={actionError}
          onSubmit={save}
          onFieldChange={field}
          onCancel={() => {
            setForm(null);
            setActionError("");
          }}
        />
      )}
      <UserList
        rows={rows}
        currentUserId={user.id}
        query={query}
        role={role}
        onQueryChange={setQuery}
        onRoleChange={setRole}
        isSaving={isSaving}
        onLock={changeLock}
        onOpen={(account) => {
          setForm({ ...account });
          setActionError("");
          setMessage("");
        }}
      />
    </div>
  );
}
