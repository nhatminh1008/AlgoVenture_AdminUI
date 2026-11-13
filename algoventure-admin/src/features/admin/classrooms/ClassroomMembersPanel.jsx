import { useCallback, useState } from "react";
import { addClassroomMember, listClassroomMembers, removeClassroomMember } from "./adminClassroomService";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";

export default function ClassroomMembersPanel({ classroom, users, onClose }) {
  const { id: classroomId } = classroom;
  const loadMembers = useCallback(() => listClassroomMembers(classroomId), [classroomId]);
  const members = useApiData(loadMembers, []);
  const [learner, setLearner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const existing = new Set(members.data.map(({ id }) => id));
  const eligible = users.filter(({ id, role, status }) => role === "learner" && status === "Active" && !existing.has(id));

  async function add(event) {
    event.preventDefault();
    await mutate(async () => {
      members.setData(await addClassroomMember(classroomId, learner));
      setLearner("");
    });
  }

  async function remove(user) {
    if (!window.confirm(`Gỡ ${user.name} khỏi lớp?`)) return;
    await mutate(async () => {
      await removeClassroomMember(classroomId, user.id);
      members.setData((rows) => rows.filter(({ id }) => id !== user.id));
    });
  }

  async function mutate(action) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <section className="panel mt-6 space-y-4 p-6" aria-label={`Thành viên lớp ${classroom.name}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{classroom.name}</h2>
      <button type="button" className="btn-secondary" onClick={onClose}>Đóng</button>
    </div>
    <ApiFeedback state={members} />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!members.loading && !members.error && <>
      {!classroom.archivedAt && <form className="flex flex-wrap items-end gap-3" onSubmit={add}>
        <label className="flex-1">
          <span className="field-label">Thêm học viên</span>
          <select className="field" required value={learner} disabled={isSubmitting}
            onChange={(event) => setLearner(event.target.value)}>
            <option value="">Chọn học viên</option>
            {eligible.map(({ id, name, email }) => <option key={id} value={id}>{name} ({email})</option>)}
          </select>
        </label>
        <button className="btn-primary" disabled={isSubmitting || !learner}>Thêm vào lớp</button>
      </form>}
      {members.data.length ? <ul className="space-y-3">
        {members.data.map((user) => <li key={user.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span>{user.name} · {user.email}</span>
          {!classroom.archivedAt && <button type="button" className="text-sm text-red-700" disabled={isSubmitting}
            onClick={() => remove(user)}>Gỡ khỏi lớp</button>}
        </li>)}
      </ul> : <p className="text-sm text-slate-500">Lớp chưa có học viên.</p>}
    </>}
  </section>;
}
