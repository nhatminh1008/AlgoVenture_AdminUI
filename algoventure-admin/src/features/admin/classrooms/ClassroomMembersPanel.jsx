import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useCallback } from "react";
import { listClassroomMembers } from "./adminClassroomService";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";

export default function ClassroomMembersPanel({ classroom, onClose }) {
  const text = useText();
  const { id: classroomId } = classroom;
  const loadMembers = useCallback(() => listClassroomMembers(classroomId), [classroomId]);
  const members = useApiData(loadMembers, []);
  const pagination = usePagination(members.data, classroom.id);
  return <section className="panel mt-6 space-y-4 p-6" aria-label={`Thành viên lớp ${classroom.name}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{classroom.name}</h2>
      <button type="button" className="btn-secondary" onClick={onClose}>{text("Đóng")}</button>
    </div>
    <ApiFeedback state={members} />
    {!members.loading && !members.error && <>
      {members.data.length ? <ul className="space-y-3">
        {pagination.items.map((user) => <li key={user.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span>{user.name} · {user.email}</span>
        </li>)}
      </ul> : <p className="text-sm text-slate-500">{text("Lớp chưa có học viên.")}</p>}
      <Pagination pagination={pagination} />
    </>}
  </section>;
}
