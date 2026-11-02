import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Plus, Pencil, Users, Layers, Download } from "lucide-react";
import { PageHeader, StudentIdentity } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { getTopic, getLevel, lessonName } from "../data/curriculum";
import ClassNavigation from "../components/ClassNavigation";
import { downloadFile, exportStudentRows } from "../data/classroom";
import ClassQuizzes from "../components/ClassQuizzes";

export const assignmentStatus = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};
export default function ClassDetail() {
  const { classId } = useParams();
  const { classes, students, assignments } = useClassrooms();
  const [params] = useSearchParams();
  const location = useLocation();
  const classroom = classes.find((item) => item.id === classId);
  if (!classroom)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">Không tìm thấy lớp học</h1>
        <Link to="/instructor/classes" className="btn-secondary mt-5">
          Về lớp của tôi
        </Link>
      </div>
    );
  const topic = getTopic(classroom.topicId);
  const members = students.filter((item) => item.classId === classId);
  const sets = assignments.filter((item) => item.classId === classId);
  const tab = [
    "assignments",
    "quizzes",
    "students",
  ].includes(params.get("tab"))
    ? params.get("tab")
    : "assignments";
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={classroom.name}
      >
        <Link
          to={`/instructor/classes/${classId}/edit`}
          className="btn-secondary"
        >
          <Pencil size={16} />
          Sửa thông tin
        </Link>
        <button className="btn-secondary" disabled={!members.length} onClick={() => downloadFile(exportStudentRows(members, classes), "class-results.csv")}><Download size={16} />Xuất CSV</button>
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
        <div className="instructor-detail-tags"><span>{topic.name}</span><span>{getLevel(classroom.level).label}</span><span><Users size={15} />{members.length} sinh viên</span></div>
        <div className="instructor-invite"><span>Mã tham gia</span><strong>{classroom.inviteCode}</strong></div>
      </div>
      {classroom.description && <p className="mb-5 whitespace-pre-wrap text-sm text-slate-600">{classroom.description}</p>}
      <ClassNavigation classId={classId} active={tab} />
      <section id="class-panel">
        {tab === "quizzes" && <ClassQuizzes key={classId} classId={classId} />}
        {tab === "assignments" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Bộ thử thách ({sets.length})</h2><Link className="btn-primary" to={`/instructor/challenges?classId=${classId}`}><Plus size={17} />Giao thử thách</Link></div>
            {sets.map((set) => (
              <article className="panel p-5 sm:p-6" key={set.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {set.title}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {set.lessonIds.length} bài · Hạn: {set.due || "Chưa đặt"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${set.status === "Active" ? "bg-portal-lavender text-portal-purple-strong" : "bg-slate-100 text-slate-600"}`}
                  >
                    {assignmentStatus[set.status]}
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
                  to={`/instructor/challenges?classId=${classId}&assignmentId=${set.id}`}
                  className="mt-4 inline-flex text-sm font-semibold text-portal-purple-strong"
                >
                  {set.status === "Draft"
                    ? "Chỉnh sửa bộ bài →"
                    : "Xem bộ bài →"}
                </Link>
              </article>
            ))}
            {!sets.length && (
              <div className="panel p-10 text-center">
                <Layers size={32} className="mx-auto mb-3 text-slate-300" />
                <h2 className="font-semibold">Lớp chưa có bộ thử thách</h2>
                <Link
                  className="btn-primary mt-5"
                  to={`/instructor/challenges?classId=${classId}`}
                >
                  Tạo bộ thử thách
                </Link>
              </div>
            )}
          </div>
        )}
        {tab === "students" && (
          <div className="panel overflow-hidden">
            {members.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sinh viên</th>
                        <th>Email</th>
                        <th>Điểm quiz / 100</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td><StudentIdentity name={member.name} /></td>
                          <td>{member.email}</td>
                          <td><strong className="text-portal-ink">{member.score ?? "—"}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link
                  className="m-5 inline-flex text-sm font-semibold text-portal-purple-strong"
                  to={`/instructor/progress?classId=${classId}`}
                >
                  Xem dữ liệu học tập →
                </Link>
              </>
            ) : (
              <div className="p-10 text-center">
                <Users size={32} className="mx-auto mb-3 text-slate-300" />
                <h2 className="font-semibold">Chưa có sinh viên tham gia</h2>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
