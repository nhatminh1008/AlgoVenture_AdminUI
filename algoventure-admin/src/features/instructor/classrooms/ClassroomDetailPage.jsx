import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Users, Layers, Download } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { StudentIdentity } from "./StudentIdentity";
import { useClassrooms } from "../workspace/ClassroomContext";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";
import ClassNavigation from "./ClassNavigation";
import { downloadFile, exportStudentRows } from "../reports/studentResultsExport";
import ClassQuizzes from "../quizzes/ClassQuizzes";
import { OverdueLink, StudentListControls, StudentProgressLink } from "../reports/StudentProgressLinks";
import { filterStudents } from "../reports/filterStudents";
import { useInstructorParams } from "../workspace/useInstructorParams";

const assignmentStatus = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};
export default function ClassroomDetailPage() {
  const text = useText();
  const { classId } = useParams();
  const { classes, students, assignments, lessonName } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const members = students.filter((item) => item.classId === classId);
  const sets = assignments.filter((item) => item.classId === classId);
  const controls = useInstructorParams();
  const { params } = controls;
  const query = params.get("q") ?? "";
  const overdue = params.get("overdue") === "1";
  const membersPage = usePagination(filterStudents(members, query, overdue), classId, controls);
  const setsPage = usePagination(sets, classId, useInstructorParams("setsPage"));
  const memberColumns = [
    { key: "name", title: text("Sinh viên"), layout: "primary", render: (member) => <StudentIdentity name={member.name} /> },
    { key: "email", title: text("Email"), layout: "secondary", render: (member) => member.email },
    {
      key: "score", title: text("Điểm quiz / 100"),
      hint: text("Trung bình điểm cao nhất của từng quiz đã nộp"),
      render: (member) => <strong className="text-portal-ink">{member.score ?? "—"}</strong>,
    },
    { key: "overdue", title: text("Bài quá hạn"), render: (row) => <OverdueLink row={row} /> },
    { key: "actions", title: text("Thao tác"), layout: "actions", render: (row) => <StudentProgressLink row={row} /> },
  ];
  if (!classroom)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">{text("Không tìm thấy lớp học")}</h1>
        <InstructorBackLink />
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
      <InstructorBackLink />
      <PageHeader
        title={classroom.name}
      >
        {!classroom.archivedAt && (
          <InstructorLink to={`/instructor/classes/${classId}/edit`} className="btn-secondary">
            <Pencil size={16} />
            {text("Sửa thông tin")}
          </InstructorLink>
        )}
        <button className="btn-secondary" disabled={!members.length} onClick={() => downloadFile(exportStudentRows(members, classes), "class-results.csv")}><Download size={16} />{text("Xuất CSV")}</button>
      </PageHeader>
      <div className="instructor-detail-summary">
        <div className="instructor-detail-tags"><span>{getLevel(classroom.level).label}</span><span><Users size={15} />{members.length} {text(" sinh viên")}</span></div>
        {classroom.archivedAt ? (
          <span className="instructor-badge instructor-badge-closed">{text("Đã lưu trữ")}</span>
        ) : (
          <div className="instructor-invite"><span>{text("Mã tham gia")}</span><strong>{classroom.inviteCode}</strong></div>
        )}
      </div>
      {classroom.description && <p className="mb-5 wrap-anywhere whitespace-pre-wrap text-sm text-slate-600">{classroom.description}</p>}
      <ClassNavigation classId={classId} active={tab} />
      <section id="class-panel">
        {tab === "quizzes" && <ClassQuizzes key={classId} classId={classId} />}
        {tab === "assignments" && (
          <div className="space-y-4">
            <Pagination pagination={setsPage} />
            <div className="instructor-section-actions flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{text("Bộ thử thách (")}{sets.length})</h2>{!classroom.archivedAt && <InstructorLink className="btn-primary" to={`/instructor/classes/${classId}/assign`}><Plus size={17} />{text("Giao bài")}</InstructorLink>}</div>
            {setsPage.items.map((set) => {
              const canEdit = !classroom.archivedAt && !set.archivedAt && set.status === "Draft" && set.assignmentTemplateId;
              const destination = canEdit
                ? `/instructor/challenges?assignmentTemplateId=${encodeURIComponent(set.assignmentTemplateId)}&classId=${encodeURIComponent(classId)}`
                : `/instructor/challenges?classId=${encodeURIComponent(classId)}&assignmentId=${encodeURIComponent(set.id)}`;
              return (
                <article className="instructor-compact-panel panel p-5 sm:p-6" key={set.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {set.title}
                      </h2>
                      <p className="mt-2 text-xs text-slate-500">
                        {set.lessonIds.length} {text("mục thực hành")} · {text("Hạn")} {set.due || text("Chưa đặt")}
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
                  <InstructorLink
                    to={destination}

                    className="instructor-touch-link mt-4 inline-flex text-sm font-semibold text-portal-purple-strong"
                  >
                    {canEdit
                      ? text("Chỉnh sửa bộ bài →")
                      : text("Xem bộ bài →")}
                  </InstructorLink>
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
                <StudentListControls query={query} overdue={overdue}
                  onQuery={(value) => controls.set("q", value, true)}
                  onOverdue={(value) => controls.set("overdue", value ? "1" : "", true)} />
                <RecordTable label={text("Sinh viên")} columns={memberColumns} rows={membersPage.items}
                  emptyMessage={text("Không tìm thấy sinh viên phù hợp.")} />
                <Pagination pagination={membersPage} />
                <InstructorLink
                  className="instructor-touch-link m-5 inline-flex text-sm font-semibold text-portal-purple-strong"
                  to={`/instructor/progress?classId=${classId}`}

                >
                  {text("Xem dữ liệu học tập →")}
                </InstructorLink>
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
