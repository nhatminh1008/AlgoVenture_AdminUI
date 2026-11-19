import { useActionToast } from "../../../shared/components/useActionToast";
import { useText } from "../../../preferences/preferencesContext";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { useClassrooms } from "../workspace/useClassrooms";
import QuizPreview from "./QuizPreview";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";
import { progressResultsPath } from "../workspace/useInstructorNavigation";
import QuizQuestionResults from "./QuizResults";

export default function QuizDetailPage() {
  const text = useText();
  const { classId, quizId } = useParams();
  const location = useLocation();
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
  const params = new URLSearchParams(location.search);
  if (quiz.status !== "Draft" && params.get("tab") === "results") {
    return <Navigate to={progressResultsPath(classId, "quizzes", quizId, params)}
      state={location.state} replace />;
  }

  return <QuizDetailContent key={quiz.id} classroom={classroom} quiz={quiz}
    showQuestions={quiz.status !== "Draft" && params.get("tab") === "questions"} />;
}
function QuizDetailContent({ classroom, quiz, showQuestions }) {
  const text = useText();
  const toast = useActionToast();
  const { markQuizClosed } = useClassrooms();
  const [closing, setClosing] = useState(false);

  async function close() {
    if (closing || !window.confirm(text(
      "Đóng bài trắc nghiệm? Học viên sẽ dừng nộp bài mới. Kết quả đã ghi được giữ lại.",
      "Close this quiz? Learners will no longer be able to submit. Existing results are kept.",
    ))) return;
    setClosing(true);
    try {
      await markQuizClosed(quiz.id);
      toast(text("Đã đóng bài trắc nghiệm.", "Quiz closed."));
    } catch (failure) {
      toast(failure.message, true);
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
        {quiz.status !== "Draft" && (
          <InstructorLink className="btn-secondary" to={progressResultsPath(classroom.id, "quizzes", quiz.id)}>
            {text("Xem kết quả", "View results")}
          </InstructorLink>
        )}
        {quiz.status !== "Draft" && <InstructorLink className="btn-secondary" to={showQuestions ? "?" : "?tab=questions"}
          replace>{showQuestions ? text("Xem nội dung quiz", "View quiz content") : text("Kết quả theo câu hỏi", "Results by question")}</InstructorLink>}
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
      {showQuestions ? <QuizQuestionResults classId={classroom.id} quizId={quiz.id} /> : <>
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
      <QuizPreview quiz={quiz} />
      </>}
    </div>
  );
}
