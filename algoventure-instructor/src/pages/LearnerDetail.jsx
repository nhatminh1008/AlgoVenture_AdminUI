import { Link, useParams } from "react-router-dom";
import { useClassrooms } from "../data/ClassroomContext";
import { gradebookRows, bestAttempt, scoreTrend } from "../data/metrics.js";
import { formatDate } from "../data/dates.js";
import { PageHeader, StatCard, LoadState, EmptyState } from "../components/ui";
import { TrendChart, LearnerGradeTable } from "../components/ReportViews";

export default function LearnerDetail() {
  const data = useClassrooms();
  const { classId, learnerId } = useParams();
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const classroom = data.classrooms.find((item) => item.id === classId);
  const member = data.enrollments.find(
    (item) => item.classroomId === classId && item.learnerId === learnerId,
  );
  if (!classroom || !member)
    return (
      <EmptyState
        title="Không tìm thấy học viên trong lớp được phép xem"
        action={
          <Link className="btn-secondary" to="/classes">
            Về lớp học
          </Link>
        }
      />
    );
  const assignments = data.assignments.filter(
    (item) => item.classroomId === classId && item.status === "published",
  );
  const attempts = data.attempts.filter(
    (item) =>
      item.learnerId === learnerId &&
      assignments.some((assignment) => assignment.id === item.assignmentId),
  );
  const rows = gradebookRows(
    [classroom],
    [member],
    assignments,
    attempts,
    data.now,
  );
  const missed = assignments.flatMap((assignment) => {
    const best = bestAttempt(
      attempts.filter((item) => item.assignmentId === assignment.id),
    );
    return best
      ? assignment.questions
          .filter(
            (question) =>
              best.answers.find((answer) => answer.questionId === question.id)
                ?.selectedIndex !== question.correctIndex,
          )
          .map((question) => ({
            ...question,
            assignmentTitle: assignment.title,
            selected:
              best.answers.find((answer) => answer.questionId === question.id)
                ?.selectedIndex ?? null,
          }))
      : [];
  });
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb={`${classroom.title} / Học viên`}
        title={member.learnerName}
      >
        <Link className="btn-secondary" to={`/classes/${classId}?tab=learners`}>
          Về lớp học
        </Link>
      </PageHeader>
      <p className="mb-6 text-sm text-slate-500">
        {member.learnerEmail} · Tham gia: {formatDate(member.joinedAt)} (giờ
        Việt Nam)
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Bài đã nộp"
          value={`${rows.filter((row) => row.attemptCount > 0).length}/${rows.length}`}
        />
        <StatCard title="Tổng lượt làm" value={attempts.length} />
        <StatCard
          title="Câu sai/bỏ trống ở lượt tốt nhất"
          value={missed.length}
        />
      </div>
      <LearnerGradeTable rows={rows} classroomId={classId} />
      <div className="my-6">
        <TrendChart data={scoreTrend(attempts)} />
      </div>
      <section className="panel overflow-hidden">
        <div className="p-6">
          <h2 className="font-bold">Câu cần ôn tập</h2>
          <p className="mt-2 text-xs text-slate-500">
            Sai hoặc bỏ trống ở lượt tốt nhất của từng bài tập.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bài tập / Câu hỏi</th>
                <th>Đáp án đã chọn</th>
                <th>Đáp án đúng / Giải thích</th>
              </tr>
            </thead>
            <tbody>
              {missed.map((question) => (
                <tr key={question.id}>
                  <td className="min-w-64">
                    <p className="mb-2 text-xs text-slate-400">
                      {question.assignmentTitle}
                    </p>
                    {question.prompt}
                  </td>
                  <td className="min-w-40">
                    {question.selected === null
                      ? "Bỏ trống"
                      : question.options[question.selected]}
                  </td>
                  <td className="min-w-64">
                    <p className="font-semibold text-emerald-700">
                      {question.options[question.correctIndex]}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {question.explanation}
                    </p>
                  </td>
                </tr>
              ))}
              {!missed.length && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Chưa ghi nhận câu sai ở các lượt tốt nhất hiện có.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
