import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { createUser, listUsers, lockUser, saveMyProfile } from "./userService";
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
  const displayedForm = viewing ? state.data.find((account) => account.id === form.id) ?? form : form;
  const rows = state.data.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      `${u.name} ${u.email} ${u.username ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function save(event) {
    event.preventDefault();
    if (isSaving || viewing) return;
    setIsSaving(true);
    setMessage("");
    setActionError("");
    try {
      if (isOwnProfile) {
        const updated = await saveMyProfile(form);
        if (!(await updateSessionProfile(updated))) return;
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
  async function lock(account) {
    if (isSaving || !window.confirm(text(
      `Khóa tài khoản “${account.email}”? Người dùng sẽ bị đăng xuất và không thể đăng nhập.`,
      `Lock “${account.email}”? The user will be signed out and unable to sign in.`,
    ))) return;
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      await lockUser(account.id);
      await state.refresh();
      setMessage(text("Đã khóa tài khoản.", "Account locked."));
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
          form={displayedForm}
          isOwnProfile={isOwnProfile}
          viewing={viewing}
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
        onLock={lock}
        onOpen={(account) => {
          setForm({ ...account });
          setActionError("");
          setMessage("");
        }}
      />
    </div>
  );
}
