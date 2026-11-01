import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Users, BookOpen, Layers } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { getTopic, getLevel, lessonName } from "../data/curriculum";
import ClassMaterials from "../components/ClassMaterials";
import ClassQuizzes from "../components/ClassQuizzes";

export const assignmentStatus = {
  Draft: "Bản nháp",
  Active: "Đang giao",
  Closed: "Đã đóng",
};
export default function ClassDetail() {
  const { classId } = useParams();
  const { classes, students, assignments, quizzes } = useClassrooms();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const classroom = classes.find((item) => item.id === classId);
  if (!classroom)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">Không tìm thấy lớp học</h1>
        <p className="mt-2 text-sm text-slate-500">
          Lớp không tồn tại trong danh sách bạn phụ trách.
        </p>
        <Link to="/instructor/classes" className="btn-secondary mt-5">
          Về lớp của tôi
        </Link>
      </div>
    );
  const topic = getTopic(classroom.topicId);
  const members = students.filter((item) => item.classId === classId);
  const sets = assignments.filter((item) => item.classId === classId);
  const classQuizzes = quizzes.filter((item) => item.classId === classId);
  const tab = [
    "assignments",
    "quizzes",
    "materials",
    "students",
    "lessons",
  ].includes(params.get("tab"))
    ? params.get("tab")
    : "assignments";
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/instructor/classes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft size={16} />
        Lớp của tôi
      </Link>
      <PageHeader
        breadcrumb={`Lớp của tôi / ${topic.name}`}
        title={classroom.name}
      >
        <Link
          to={`/instructor/classes/${classId}/edit`}
          className="btn-secondary"
        >
          <Pencil size={16} />
          Sửa thông tin
        </Link>
        <Link
          to={`/instructor/classes/${classId}/quizzes/new`}
          className="btn-secondary"
        >
          <Plus size={17} />
          Tạo bộ câu hỏi
        </Link>
        <Link
          to={`/instructor/challenges?classId=${classId}`}
          className="btn-primary"
        >
          <Plus size={17} />
          Tạo bộ thử thách
        </Link>
      </PageHeader>
      {location.state?.message && (
        <p
          role="status"
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {location.state.message}
        </p>
      )}
      <section className="panel mb-6 p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {topic.name}
          </span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {getLevel(classroom.level).name}
          </span>
        </div>
        <p className="mt-4 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
          {classroom.description || topic.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <Users size={17} />
            {members.length} sinh viên
          </span>
          <span className="flex items-center gap-2">
            <Layers size={17} />
            {sets.length + classQuizzes.length} bộ bài
          </span>
          <span className="flex items-center gap-2">
            <BookOpen size={17} />
            {topic.lessons.length} bài học
          </span>
        </div>
      </section>
      <div
        className="mb-5 flex flex-wrap gap-2 border-b border-slate-200"
        role="tablist"
        aria-label="Nội dung lớp"
      >
        {[
          ["assignments", "Bộ thử thách", sets.length],
          ["quizzes", "Trắc nghiệm", classQuizzes.length],
          ["materials", "Tài liệu", null],
          ["students", "Sinh viên", members.length],
          ["lessons", "Nội dung học tập", topic.lessons.length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls="class-panel"
            onClick={() => setParams({ tab: id })}
            className={`border-b-2 px-4 pb-4 pt-2 text-sm font-medium ${tab === id ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500"}`}
          >
            {label}{" "}
            {count !== null && (
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
      <section id="class-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "quizzes" && <ClassQuizzes key={classId} classId={classId} />}
        {tab === "materials" && (
          <ClassMaterials key={classId} classId={classId} />
        )}
        {tab === "assignments" && (
          <div className="space-y-4">
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
                    className={`rounded-full px-3 py-1 text-xs font-medium ${set.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
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
                  className="mt-4 inline-flex text-sm font-semibold text-emerald-700"
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
                <p className="mt-2 text-sm text-slate-500">
                  Chọn các bài thuộc chủ đề {topic.name} để chuẩn bị bài giao
                  đầu tiên.
                </p>
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
                        <th>Điểm học tập / 100</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td className="font-medium">{member.name}</td>
                          <td>{member.email}</td>
                          <td>{member.score ?? "Chưa có dữ liệu"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link
                  className="m-5 inline-flex text-sm font-semibold text-emerald-700"
                  to={`/instructor/progress?classId=${classId}`}
                >
                  Xem dữ liệu học tập →
                </Link>
              </>
            ) : (
              <div className="p-10 text-center">
                <Users size={32} className="mx-auto mb-3 text-slate-300" />
                <h2 className="font-semibold">Chưa có sinh viên tham gia</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Lớp mới bắt đầu với danh sách trống. Admin có thể thêm sinh
                  viên từ trang quản lý lớp.
                </p>
              </div>
            )}
          </div>
        )}
        {tab === "lessons" && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Danh mục bài trong game cho chủ đề này. Chỉ những bài được chọn
              vào bộ thử thách mới trở thành bài giao của lớp.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {topic.lessons.map(([id, name], index) => (
                <div key={id} className="panel flex items-center gap-4 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="btn-secondary"
          to={`/instructor/progress?classId=${classId}`}
        >
          Theo dõi tiến độ
        </Link>
        <Link
          className="btn-secondary"
          to={`/instructor/analytics?classId=${classId}`}
        >
          Phân tích lớp
        </Link>
        <Link
          className="btn-secondary"
          to={`/instructor/export?classId=${classId}`}
        >
          Xuất kết quả
        </Link>
      </div>
    </div>
  );
}
