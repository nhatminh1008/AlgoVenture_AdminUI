import { useActionToast } from "../../../shared/components/useActionToast";
import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { changeUserRole, createUser, deactivateUser, listUsers, saveMyProfile, setUserLocked } from "./userService";
import { useAuth } from "../../../auth/useAuth";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
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
  const toast = useActionToast();
  const { user, updateSessionProfile } = useAuth();
  const state = useApiDataWithErrorToast(listUsers, []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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
      toast(isOwnProfile ? text("Đã lưu hồ sơ cá nhân.") : text("Đã lưu tài khoản."));
    } catch (failure) {
      toast(failure.message, true);
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
    try {
      await setUserLocked(account, locked);
      await state.refresh();
      toast(locked ? text("Đã khóa tài khoản.", "Account locked.") : text("Đã mở khóa tài khoản.", "Account unlocked."));
    } catch (failure) {
      toast(failure.message, true);
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivate(account) {
    if (isSaving || !window.confirm(text(
      `Vô hiệu hóa tài khoản “${account.email}”? Người dùng sẽ bị đăng xuất và không thể đăng nhập. Dữ liệu và lịch sử học tập được giữ lại. Tài khoản này không thể mở bằng nút Mở khóa.`,
      `Deactivate “${account.email}”? The user will be signed out and unable to sign in. Learning data and history are retained. This account cannot be restored with Unlock.`,
    ))) return;
    setIsSaving(true);
    try {
      await deactivateUser(account.id);
      await state.refresh();
      toast(text("Đã vô hiệu hóa tài khoản. Dữ liệu và lịch sử học tập được giữ lại.",
        "Account deactivated. Learning data and history are retained."));
    } catch (failure) {
      toast(failure.message, true);
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
          }}
        >
          {text("+ Thêm tài khoản")}
        </button>
      </AdminPageHeader>
      <ApiFeedback state={state} />
      {form && (
        <UserForm
          form={form}
          isOwnProfile={isOwnProfile}
          viewing={viewing}
          editableRoles={canEditRole ? EDITABLE_ROLES : []}
          roleChanged={roleChanged}
          isSaving={isSaving}
          onSubmit={save}
          onFieldChange={field}
          onCancel={() => {
            setForm(null);
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
        onDeactivate={deactivate}
        onOpen={(account) => {
          setForm({ ...account });
        }}
      />
    </div>
  );
}
