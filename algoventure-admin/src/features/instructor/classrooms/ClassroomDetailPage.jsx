import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Plus, Pencil, Users, Layers, Download } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { StudentIdentity } from "./StudentIdentity";
import { useClassrooms } from "../workspace/ClassroomContext";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";
import ClassNavigation from "./ClassNavigation";
import { downloadFile, exportStudentRows } from "../reports/studentResultsExport";
import ClassQuizzes from "../quizzes/ClassQuizzes";

const assignmentStatus = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};
export default function ClassroomDetailPage() {
  const text = useText();
  const { classId } = useParams();
  const { classes, students, assignments, lessonName } = useClassrooms();
  const [params] = useSearchParams();
  const location = useLocation();
  const { back, childState } = useInstructorNavigation("/instructor/classes");
  const classroom = classes.find((item) => item.id === classId);
  const members = students.filter((item) => item.classId === classId);
  const sets = assignments.filter((item) => item.classId === classId);
  const membersPage = usePagination(members, classId);
  const setsPage = usePagination(sets, classId);
  const memberColumns = [
    { key: "name", title: text("Sinh viên"), layout: "primary", render: (member) => <StudentIdentity name={member.name} /> },
    { key: "email", title: text("Email"), layout: "secondary", render: (member) => member.email },
    {
      key: "score", title: text("Điểm quiz / 100"),
      render: (member) => <strong className="text-portal-ink">{member.score ?? "—"}</strong>,
    },
  ];
  if (!classroom)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">{text("Không tìm thấy lớp học")}</h1>
        <Link to="/instructor/classes" className="btn-secondary mt-5">
          {text("Về lớp của tôi")}
        </Link>
      </div>
    );
  const tab = [
    "assignments",
    "quizzes",
    "students",
  ].includes(params.get("tab"))
    ? params.get("tab")
    : "assignments";
  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink destination={back} />
      <PageHeader
        title={classroom.name}
      >
        {!classroom.archivedAt && (
          <Link to={`/instructor/classes/${classId}/edit`} state={childState} className="btn-secondary">
            <Pencil size={16} />
            {text("Sửa thông tin")}
          </Link>
        )}
        <button className="btn-secondary" disabled={!members.length} onClick={() => downloadFile(exportStudentRows(members, classes), "class-results.csv")}><Download size={16} />{text("Xuất CSV")}</button>
      </PageHeader>
      {location.state?.message && (
        <p
          role="status"
          className="mb-6 rounded-xl border border-portal-line-strong bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {location.state.message}
        </p>
      )}
      <div className="instructor-detail-summary">
        <div className="instructor-detail-tags"><span>{getLevel(classroom.level).label}</span><span><Users size={15} />{members.length} {text(" sinh viên")}</span></div>
        {classroom.archivedAt ? (
          <span className="instructor-badge instructor-badge-closed">{text("Đã lưu trữ")}</span>
        ) : (
          <div className="instructor-invite"><span>{text("Mã tham gia")}</span><strong>{classroom.inviteCode}</strong></div>
        )}
      </div>
      {classroom.description && <p className="mb-5 wrap-anywhere whitespace-pre-wrap text-sm text-slate-600">{classroom.description}</p>}
      <ClassNavigation classId={classId} active={tab} state={location.state?.back ? { back } : undefined} />
      <section id="class-panel">
        {tab === "quizzes" && <ClassQuizzes key={classId} classId={classId} archivedAt={classroom.archivedAt} />}
        {tab === "assignments" && (
          <div className="space-y-4">
            <Pagination pagination={setsPage} />
            <div className="instructor-section-actions flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{text("Bộ thử thách (")}{sets.length})</h2>{!classroom.archivedAt && <Link className="btn-primary" to={`/instructor/classes/${classId}/assign`} state={childState}><Plus size={17} />{text("Giao bài")}</Link>}</div>
            {setsPage.items.map((set) => {
              const canEdit = !classroom.archivedAt && !set.archivedAt && set.status === "Draft" && set.assignmentTemplateId;
              const destination = canEdit
                ? `/instructor/challenges?assignmentTemplateId=${encodeURIComponent(set.assignmentTemplateId)}`
                : `/instructor/challenges?classId=${encodeURIComponent(classId)}&assignmentId=${encodeURIComponent(set.id)}`;
              return (
                <article className="instructor-compact-panel panel p-5 sm:p-6" key={set.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {set.title}
                      </h2>
                      <p className="mt-2 text-xs text-slate-500">
                        {set.lessonIds.length} {text(" bài · Hạn: ")} {set.due || text("Chưa đặt")}
                        {set.status !== "Draft" && ` · ${set.recipientCount} ${text("người nhận", "recipients")}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${!set.archivedAt && set.status === "Active" ? "bg-portal-lavender text-portal-purple-strong" : "bg-slate-100 text-slate-600"}`}
                    >
                      {set.archivedAt ? text("Đã lưu trữ") : assignmentStatus[set.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {set.lessonIds.map((id) => (
                      <span
                        key={id}
                        className="rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                      >
                        {lessonName(id)}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={destination}
                    state={childState}
                    className="instructor-touch-link mt-4 inline-flex text-sm font-semibold text-portal-purple-strong"
                  >
                    {canEdit
                      ? text("Chỉnh sửa bộ bài →")
                      : text("Xem bộ bài →")}
                  </Link>
                </article>
              );
            })}
            {!sets.length && (
              <div className="panel p-10 text-center">
                <Layers size={32} className="mx-auto mb-3 text-slate-300" />
                <h2 className="font-semibold">{text("Lớp chưa có bộ thử thách")}</h2>
              </div>
            )}
          </div>
        )}
        {tab === "students" && (
          <div className="panel overflow-hidden">
            {members.length ? (
              <>
                <RecordTable label={text("Sinh viên")} columns={memberColumns} rows={membersPage.items} />
                <Pagination pagination={membersPage} />
                <Link
                  className="instructor-touch-link m-5 inline-flex text-sm font-semibold text-portal-purple-strong"
                  to={`/instructor/progress?classId=${classId}`}
                  state={childState}
                >
                  {text("Xem dữ liệu học tập →")}
                </Link>
              </>
            ) : (
              <div className="p-10 text-center">
                <Users size={32} className="mx-auto mb-3 text-slate-300" />
                <h2 className="font-semibold">{text("Chưa có sinh viên tham gia")}</h2>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
