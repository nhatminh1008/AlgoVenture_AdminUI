import { Link, useLocation, useParams } from "react-router-dom";
import { useClassrooms } from "../data/ClassroomContext";
import { formatDate } from "../data/dates.js";
import {
  PageHeader,
  LoadState,
  EmptyState,
  StatusBadge,
} from "../components/ui";
import AssignmentPreview from "../components/AssignmentPreview";

export default function AssignmentDetail() {
  const data = useClassrooms();
  const { classId, assignmentId } = useParams();
  const location = useLocation();
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const assignment = data.assignments.find(
    (item) => item.id === assignmentId && item.classroomId === classId,
  );
  const classroom = data.classrooms.find((item) => item.id === classId);
  if (!assignment || !classroom)
    return (
      <EmptyState
        title="Không tìm thấy bài tập"
        action={
          <Link className="btn-secondary" to="/classes">
            Về lớp học
          </Link>
        }
      />
    );
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        className="mb-5 inline-block text-sm text-emerald-700"
        to={`/classes/${classId}`}
      >
        ← Bài tập của lớp
      </Link>
      <PageHeader breadcrumb={classroom.title} title={assignment.title}>
        <Link
          className="btn-primary"
          to={`/classes/${classId}/assignments/${assignmentId}/edit`}
        >
          Chỉnh sửa
        </Link>
      </PageHeader>
      {location.state?.message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {location.state.message}
        </p>
      )}
      <section className="panel mb-6 space-y-4 p-6">
        <StatusBadge status={assignment.status} />
        <p className="text-sm text-slate-500">
          {assignment.questions.length} câu · Hạn:{" "}
          {formatDate(assignment.dueAt)} (giờ Việt Nam)
        </p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {assignment.description}
        </p>
        {assignment.status === "published" && (
          <Link
            className="inline-block text-sm font-semibold text-emerald-700"
            to={`/progress?classId=${classId}&assignmentId=${assignmentId}`}
          >
            Xem tiến độ bài tập →
          </Link>
        )}
      </section>
      <AssignmentPreview
        key={`${assignment.id}:${assignment.updatedAt}`}
        assignment={assignment}
      />
    </div>
  );
}
