import { useText } from "../../../preferences/preferencesContext";
import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { useClassrooms } from "../workspace/ClassroomContext";
import QuizPreview from "./QuizPreview";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";
import QuizResults from "./QuizResults";

export default function QuizDetailPage() {
  const text = useText();
  const { classId, quizId } = useParams();
  const { classes, quizzes } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const quiz = quizzes.find(
    (item) => item.id === quizId && item.classId === classId,
  );
  if (!classroom || !quiz)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          {text("Không tìm thấy bộ câu hỏi trong lớp này")}
        </h1>
        <InstructorBackLink />
      </div>
    );
  return <QuizDetailContent key={quiz.id} classroom={classroom} quiz={quiz} />;
}
function QuizDetailContent({ classroom, quiz }) {
  const text = useText();
  const [params] = useSearchParams();
  const { markQuizClosed } = useClassrooms();
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [closedHere, setClosedHere] = useState(false);
  const showResults = quiz.status !== "Draft" && params.get("tab") !== "preview";
  const previewParams = new URLSearchParams(params);
  previewParams.set("tab", "preview");
  const resultsParams = new URLSearchParams(params);
  resultsParams.set("tab", "results");

  async function close() {
    if (closing || !window.confirm(text(
      "Đóng bài trắc nghiệm? Học viên sẽ dừng nộp bài mới. Kết quả đã ghi được giữ lại.",
      "Close this quiz? Learners will no longer be able to submit. Existing results are kept.",
    ))) return;
    setClosing(true);
    setCloseError("");
    try {
      await markQuizClosed(quiz.id);
      setClosedHere(true);
    } catch (failure) {
      setCloseError(failure.message);
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink />
      <InstructorLink className="instructor-touch-link mb-2 flex w-fit text-sm font-semibold text-portal-purple-strong"
        to={`/instructor/classes/${classroom.id}?tab=quizzes`}>{text("Lớp")} · {classroom.name}</InstructorLink>
      <PageHeader
        title={quiz.title}
      >
        {canEditQuiz(quiz, classroom.archivedAt) && (
          <InstructorLink
            className="btn-primary"
            to={`/instructor/classes/${classroom.id}/quizzes/${quiz.id}/edit`}
          >
            <Pencil size={16} />
            {text("Chỉnh sửa bản nháp")}
          </InstructorLink>
        )}
        {quiz.status === "Published" && !quiz.archivedAt && !classroom.archivedAt && (
          <button type="button" className="btn-secondary" disabled={closing} onClick={close}>
            <Lock aria-hidden="true" size={16} />
            {closing ? text("Đang lưu…") : text("Đóng bài trắc nghiệm", "Close quiz")}
          </button>
        )}
      </PageHeader>
      {closeError && <p role="alert" className="mb-4 text-sm text-red-700">{closeError}</p>}
      {closedHere && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {text("Đã đóng bài trắc nghiệm.", "Quiz closed.")}
        </p>
      )}
      <section className="instructor-compact-panel panel mb-6 space-y-3 p-6">
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="font-semibold text-portal-purple-strong">
            {text(getQuizStatusLabel(quiz))}
          </span>
          {classroom.archivedAt && <span>{text("Lớp đã lưu trữ")}</span>}
          <span>{quiz.questions.length} {text(" câu hỏi")}</span>
          <span>
            {quiz.questions.reduce((sum, question) => sum + question.points, 0)}{" "}
            {text("điểm")}
          </span>
          <span>{quiz.due ? `${text("Hạn (UTC+7)")} · ${quiz.due.split("-").reverse().join("/")}` : text("Chưa đặt hạn")}</span>
        </div>
        {quiz.description && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {quiz.description}
          </p>
        )}
      </section>
      <nav aria-label={text("Chi tiết quiz")} className="mb-5 flex flex-wrap gap-3">
        {quiz.status !== "Draft" && <InstructorLink className={showResults ? "btn-primary" : "btn-secondary"}
          to={`?${resultsParams}`} replace aria-current={showResults ? "page" : undefined}>{text("Kết quả")}</InstructorLink>}
        <InstructorLink className={!showResults ? "btn-primary" : "btn-secondary"} to={`?${previewParams}`}
          replace aria-current={!showResults ? "page" : undefined}>{text("Xem và làm thử")}</InstructorLink>
      </nav>
      {showResults ? <QuizResults key={String(closedHere)} classId={classroom.id} quizId={quiz.id} />
        : <QuizPreview quiz={quiz} />}
    </div>
  );
}
