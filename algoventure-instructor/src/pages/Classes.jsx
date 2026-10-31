import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  GraduationCap,
  Users,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import { PageHeader, StatCard, LoadState, EmptyState } from "../components/ui";

export default function Classes() {
  const data = useClassrooms();
  const [search, setSearch] = useState("");
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const rows = data.classrooms.filter((item) =>
    `${item.title} ${item.description}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb="Không gian giảng dạy / Classroom"
        title="Lớp học của tôi"
      >
        <Link className="btn-primary" to="/classes/new">
          <Plus size={17} />
          Tạo lớp học
        </Link>
      </PageHeader>
      <div className="mb-7 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Một lớp học, một hành trình DSA.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Chia sẻ mã mời để học viên tham gia trong game, chuẩn bị bài tập và
          theo dõi kết quả từng lượt làm.
        </p>
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Lớp phụ trách"
          value={data.classrooms.length}
          icon={<GraduationCap size={20} />}
        />
        <StatCard
          title="Lượt tham gia lớp"
          value={data.enrollments.length}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Bài tập đã giao"
          value={
            data.assignments.filter((item) => item.status === "published")
              .length
          }
          icon={<ClipboardList size={20} />}
        />
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Danh sách lớp học</h2>
        <input
          aria-label="Tìm lớp học"
          className="field sm:max-w-80"
          placeholder="Tìm tên hoặc mô tả lớp..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((classroom) => (
          <article
            key={classroom.id}
            className="panel flex flex-col overflow-hidden"
          >
            <div className="h-1.5 bg-emerald-400" />
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-5 flex justify-between gap-3">
                <GraduationCap className="text-emerald-600" size={26} />
                <span className="rounded-full bg-slate-50 px-3 py-1 font-mono text-xs font-bold text-slate-600">
                  {classroom.inviteCode}
                </span>
              </div>
              <h3 className="break-words text-lg font-bold text-slate-900">
                <Link to={`/classes/${classroom.id}`}>{classroom.title}</Link>
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                {classroom.description || "Lớp học DSA của bạn."}
              </p>
              {(classroom.topicId || classroom.level) && (
                <p className="mt-3 text-xs text-slate-400">
                  {[classroom.topicId, classroom.level]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-4 pt-6 text-xs text-slate-500">
                <span>
                  {
                    data.enrollments.filter(
                      (item) => item.classroomId === classroom.id,
                    ).length
                  }{" "}
                  học viên
                </span>
                <span>
                  {
                    data.assignments.filter(
                      (item) => item.classroomId === classroom.id,
                    ).length
                  }{" "}
                  bài tập
                </span>
              </div>
            </div>
            <Link
              className="flex justify-between border-t border-slate-100 p-5 text-sm font-semibold text-emerald-700"
              to={`/classes/${classroom.id}`}
            >
              Vào lớp học
              <ArrowUpRight size={17} />
            </Link>
          </article>
        ))}
      </div>
      {!rows.length && (
        <EmptyState
          title={
            data.classrooms.length
              ? "Không tìm thấy lớp phù hợp"
              : "Chưa có lớp học"
          }
          action={
            <Link to="/classes/new" className="btn-primary">
              Tạo lớp đầu tiên
            </Link>
          }
        >
          Tạo lớp và chia sẻ mã mời với học viên trong game.
        </EmptyState>
      )}
    </div>
  );
}
