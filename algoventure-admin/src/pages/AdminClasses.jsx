import { useState } from "react";
import { api } from "../api/client";
import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
export default function AdminClasses() {
  const state = useApiData("/admin/classes", []);
  const users = useApiData("/admin/users", []);
  const [selected, setSelected] = useState(null);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader title="Classroom Management" />
      <ApiFeedback state={state} />
      <ApiFeedback state={users} />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lớp học</th>
              <th>Chủ đề</th>
              <th>Giảng viên</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.topicId}</td>
                <td>
                  {users.data.find((u) => u.id === c.instructorId)?.name ||
                    c.instructorId}
                </td>
                <td>
                  <button
                    className="text-portal-purple-strong"
                    onClick={() => setSelected(c)}
                  >
                    Quản lý
                  </button>
                </td>
              </tr>
            ))}
            {!state.data.length && (
              <tr>
                <td colSpan={4}>
                  Chưa có lớp học.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <Manage
          key={selected.id}
          classroom={selected}
          users={users.data}
          onAssigned={(rows) => {
            state.setData(rows);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
function Manage({ classroom, users, onAssigned }) {
  const state = useApiData(`/admin/classes/${classroom.id}/members`, []);
  const [instructor, setInstructor] = useState(classroom.instructorId);
  const [learner, setLearner] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(path, method, body) {
    setBusy(true);
    try {
      const result = await api(path, { method, body });
      state.setError("");
      return result;
    } catch (f) {
      state.setError(f.message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel mt-6 space-y-5 p-6">
      <h2 className="text-lg font-bold">{classroom.name}</h2>
      <ApiFeedback state={state} />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const rows = await action(
            `/admin/classes/${classroom.id}/instructor`,
            "PUT",
            { instructorId: instructor },
          );
          if (rows) onAssigned(rows);
        }}
      >
        <label className="flex-1">
          <span className="field-label">Giảng viên phụ trách</span>
          <select
            className="field"
            required
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          >
            {users
              .filter((u) => u.role === "instructor" && u.status === "Active")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <button className="btn-secondary" disabled={busy}>
          Lưu phân công
        </button>
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const rows = await action(
            `/admin/classes/${classroom.id}/members`,
            "POST",
            { userId: learner },
          );
          if (rows) {
            state.setData(rows);
            setLearner("");
          }
        }}
      >
        <label className="flex-1">
          <span className="field-label">Thêm học viên</span>
          <select
            className="field"
            required
            value={learner}
            onChange={(e) => setLearner(e.target.value)}
          >
            <option value="">Chọn học viên</option>
            {users
              .filter(
                (u) =>
                  u.role === "learner" &&
                  u.status === "Active" &&
                  !state.data.some((m) => m.id === u.id),
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </select>
        </label>
        <button className="btn-primary" disabled={busy}>
          Thêm vào lớp
        </button>
      </form>
      <ul className="space-y-3">
        {state.data.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
          >
            <span>
              {u.name} · {u.email}
            </span>
            <button
              className="text-sm text-red-700"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm(`Gỡ ${u.name} khỏi lớp?`)) return;
                const result = await action(
                  `/admin/classes/${classroom.id}/members/${u.id}`,
                  "DELETE",
                );
                if (result !== undefined)
                  state.setData((previous) =>
                    previous.filter((m) => m.id !== u.id),
                  );
              }}
            >
              Gỡ khỏi lớp
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
