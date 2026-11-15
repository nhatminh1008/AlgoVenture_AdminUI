import { useText } from "../../../preferences/preferencesContext";
import { Link, useLocation, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/ClassroomContext";
import QuizPreview from "./QuizPreview";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";

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
        <Link className="btn-secondary mt-4" to="/instructor/classes">
          {text("Về lớp của tôi")}
        </Link>
      </div>
    );
  return <QuizDetailContent key={quiz.id} classroom={classroom} quiz={quiz} />;
}
function QuizDetailContent({ classroom, quiz }) {
  const text = useText();
  const location = useLocation();
  const { back, childState } = useInstructorNavigation(`/instructor/classes/${classroom.id}?tab=quizzes`);
  return (
    <div className="mx-auto max-w-4xl">
      <InstructorBackLink destination={back} />
      <PageHeader
        title={quiz.title}
      >
        {canEditQuiz(quiz, classroom.archivedAt) && (
          <Link
            className="btn-primary"
            to={`/instructor/classes/${classroom.id}/quizzes/${quiz.id}/edit`}
            state={childState}
          >
            <Pencil size={16} />
            {text("Chỉnh sửa bản nháp")}
          </Link>
        )}
      </PageHeader>
      {location.state?.message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {location.state.message}
        </p>
      )}
      <section className="panel mb-6 space-y-3 p-6">
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="font-semibold text-portal-purple-strong">
            {getQuizStatusLabel(quiz)}
          </span>
          {classroom.archivedAt && <span>{text("Lớp đã lưu trữ")}</span>}
          <span>{quiz.questions.length} {text(" câu hỏi")}</span>
          <span>
            {quiz.questions.reduce((sum, question) => sum + question.points, 0)}{" "}
            {text("điểm")}
          </span>
          {quiz.due && <span>{text("Hạn: ")} {quiz.due}</span>}
        </div>
        {quiz.description && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {quiz.description}
          </p>
        )}
      </section>
      <QuizPreview quiz={quiz} />
    </div>
  );
}
