import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Users } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { StudentIdentity } from "./StudentIdentity";
import { useClassrooms } from "../workspace/useClassrooms";
import { getLevel } from "../../../shared/curriculum/curriculumCatalog";
import AssignmentDeliveryTable from "../assignments/AssignmentDeliveryTable";
import ClassNavigation from "./ClassNavigation";
import ClassQuizzes from "../quizzes/ClassQuizzes";
import { StudentSearch } from "../reports/StudentProgressLinks";
import { filterStudents } from "../reports/filterStudents";
import { useInstructorParams } from "../workspace/useInstructorParams";

export default function ClassroomDetailPage() {
  const text = useText();
  const { classId } = useParams();
  const { classes, students, assignments } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const members = students.filter((item) => item.classId === classId);
  const sets = assignments.filter((item) => item.classId === classId);
  const controls = useInstructorParams();
  const { params } = controls;
  const query = params.get("q") ?? "";
  const membersPage = usePagination(filterStudents(members, query), classId, controls);
  const setsPage = usePagination(sets, classId, useInstructorParams("setsPage"));
  const memberColumns = [
    { key: "name", title: text("Sinh viên"), layout: "primary", render: (member) => <StudentIdentity name={member.name} /> },
    { key: "email", title: text("Email"), layout: "secondary", render: (member) => member.email },
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
      </PageHeader>
      <div className="instructor-detail-summary">
        <div className="instructor-detail-tags"><span>{text(getLevel(classroom.level)?.label ?? classroom.level)}</span><span><Users size={15} />{members.length} {text(" sinh viên")}</span></div>
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
            <div className="instructor-section-actions flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{text("Bộ thử thách")} ({sets.length})</h2>
              {!classroom.archivedAt && <InstructorLink className="btn-primary" to={`/instructor/classes/${classId}/assign`}>
                <Plus size={17} />{text("Giao bài")}
              </InstructorLink>}
            </div>
            <AssignmentDeliveryTable pagination={setsPage} classroom={classroom}
              emptyMessage={text("Lớp chưa có bộ thử thách")} />
          </div>
        )}
        {tab === "students" && (
          <div className="panel overflow-hidden">
            {members.length ? (
              <>
                <StudentSearch query={query} onQuery={(value) => controls.set("q", value, true)} />
                <RecordTable label={text("Sinh viên")} columns={memberColumns} rows={membersPage.items}
                  emptyMessage={text("Không tìm thấy sinh viên phù hợp.")} />
                <Pagination pagination={membersPage} />
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
