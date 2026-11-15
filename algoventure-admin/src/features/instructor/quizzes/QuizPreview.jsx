import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { CheckCircle2, RotateCcw, Eye } from "lucide-react";
import { gradeQuiz } from "./quizPreviewScoring";
import { validateQuiz } from "./quizValidation";

export default function QuizPreview({ quiz }) {
  const text = useText();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [answerNotice, setAnswerNotice] = useState(false);
  const pagination = usePagination(quiz.questions, quiz.id);
  const error = validateQuiz(
    { ...quiz, status: "Published" },
    { id: quiz.classId },
  );
  if (error)
    return (
      <p className="panel p-6 text-sm text-amber-800">
        {text("Bản nháp chưa đủ nội dung để làm thử: ")} {error}
      </p>
    );
  return (
    <div>
      <div className="instructor-quiz-note" title={text("Kết quả làm thử không được ghi vào kết quả của sinh viên.")}><Eye size={16} />{text("Chế độ làm thử")}</div>
      {result && (
        <div
          role="status"
          className="panel mb-5 flex flex-wrap items-center justify-between gap-4 p-6"
        >
          <div>
            <p className="mb-2 text-sm text-slate-500">{text("Kết quả làm thử")}</p>
            <p className="text-2xl font-bold text-portal-purple-strong">
              {result.score}/{result.maxScore} {text(" điểm")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {text("Đúng ")} {result.correctCount}/{quiz.questions.length} {text(" câu")}
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setAnswers({});
              setResult(null);
              setAnswerNotice(false);
              pagination.setPage(0);
            }}
          >
            <RotateCcw size={16} />
            {text("Làm lại")}
          </button>
        </div>
      )}
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const unanswered = quiz.questions.findIndex((question) => !answers[question.id]);
          if (unanswered >= 0) {
            setAnswerNotice(true);
            pagination.setPage(Math.floor(unanswered / 10));
            return;
          }
          setAnswerNotice(false);
          setResult(gradeQuiz(quiz, answers));
        }}
      >
        {pagination.items.map((question, offset) => (
          <fieldset
            key={question.id}
            disabled={Boolean(result)}
            className="instructor-compact-panel panel p-5 sm:p-6"
          >
            <legend className="sr-only">{text("Câu ")} {pagination.page * 10 + offset + 1}</legend>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900">
                {pagination.page * 10 + offset + 1}. {question.prompt}
              </h3>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {question.points} {text(" điểm")}
              </span>
            </div>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={option.id}
                  className={`instructor-pick flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm ${result && option.id === question.correctOptionId ? "border-portal-line-strong bg-portal-lavender text-portal-ink" : result && answers[question.id] === option.id ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 text-slate-600"}`}
                >
                  <input
                    aria-required="true"
                    className="mt-1 accent-portal-purple"
                    type="radio"
                    name={`answer-${question.id}`}
                    checked={answers[question.id] === option.id}
                    onChange={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: option.id,
                      }))
                    }
                  />
                  <span className="shrink-0 font-semibold">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">
                    {option.text}
                  </span>
                  {result && option.id === question.correctOptionId && (
                    <CheckCircle2 size={17} className="ml-auto shrink-0" />
                  )}
                </label>
              ))}
            </div>
            {result && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold">
                  {answers[question.id] === question.correctOptionId
                    ? text("Trả lời đúng")
                    : text("Chưa đúng")}{" "}
                  {text("· Đáp án:")}{" "}
                  {String.fromCharCode(
                    65 +
                      question.options.findIndex(
                        (option) => option.id === question.correctOptionId,
                      ),
                  )}
                </p>
                {question.explanation && (
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        ))}
        {answerNotice && <p role="alert">{text("Hãy trả lời tất cả câu hỏi trước khi nộp.", "Answer every question before submitting.")}</p>}
        {!result && (
          <button className="btn-primary" type="submit">
            {text("Nộp bài làm thử")}
          </button>
        )}
        <Pagination pagination={pagination} />
      </form>
    </div>
  );
}
