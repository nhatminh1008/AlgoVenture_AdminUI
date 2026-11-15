import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useCallback } from "react";
import { listClassroomChallengeSets, listClassroomMembers } from "./adminClassroomService";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { useApiData } from "../../../shared/hooks/useApiData";
import AdminDetailsDialog from "../AdminDetailsDialog";
import RecordTable from "../../../shared/components/RecordTable";
import RecordBadge from "../RecordBadge";

export default function ClassroomDetailsPanel({ classroom, onClose }) {
  const text = useText();
  const { id: classroomId } = classroom;
  const loadMembers = useCallback(() => listClassroomMembers(classroomId), [classroomId]);
  const loadChallengeSets = useCallback(() => listClassroomChallengeSets(classroomId), [classroomId]);
  const members = useApiData(loadMembers, []);
  const challengeSets = useApiData(loadChallengeSets, []);
  const membersPage = usePagination(members.data, classroomId);
  const setsPage = usePagination(challengeSets.data, classroomId);
  const membersReady = !members.loading && !members.error;
  const setsReady = !challengeSets.loading && !challengeSets.error;
  const columns = [
    {
      key: "title", title: text("Tên bộ thử thách", "Challenge set name"), layout: "primary",
      render: (set) => <>
        {set.title}
        {set.description && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{set.description}</p>}
      </>,
    },
    { key: "lessonCount", title: text("Số bài", "Lessons"), render: (set) => set.lessonIds.length },
    {
      key: "due", title: text("Hạn nộp", "Due date"),
      render: (set) => set.due ? <time dateTime={set.due}>{set.due}</time> : text("Chưa đặt"),
    },
    {
      key: "status", title: text("Trạng thái"),
      render: (set) => <RecordBadge value={set.archivedAt ? "Đã lưu trữ" : set.status === "Active" ? "Publish" : set.status} />,
    },
  ];
  return <AdminDetailsDialog title={classroom.name} onClose={onClose}>
    {classroom.description && <p>{classroom.description}</p>}
    <section className="space-y-3" aria-labelledby="classroom-members-heading">
      <h3 id="classroom-members-heading" className="font-semibold">
        {text("Thành viên")}{membersReady && ` (${members.data.length})`}
      </h3>
      <ApiFeedback state={members} />
      {membersReady && <>
        {members.data.length ? <ul className="space-y-3">
          {membersPage.items.map((user) => <li key={user.id} className="break-words border-t border-slate-100 pt-3">
            {user.name} · {user.email}
          </li>)}
        </ul> : <p className="text-sm text-slate-500">{text("Lớp chưa có học viên.")}</p>}
        <Pagination pagination={membersPage} />
      </>}
    </section>
    <section className="space-y-3" aria-labelledby="classroom-challenge-sets-heading">
      <h3 id="classroom-challenge-sets-heading" className="font-semibold">
        {text("Bộ thử thách")}{setsReady && ` (${challengeSets.data.length})`}
      </h3>
      <ApiFeedback state={challengeSets} />
      {setsReady && (challengeSets.data.length ? <>
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <RecordTable label={text("Bộ thử thách")} columns={columns} rows={setsPage.items} />
        </div>
        <Pagination pagination={setsPage} />
      </> : <p className="text-sm text-slate-500">{text("Lớp chưa có bộ thử thách.", "This classroom has no challenge sets.")}</p>)}
    </section>
  </AdminDetailsDialog>;
}
