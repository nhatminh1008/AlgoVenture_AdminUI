import { useState } from "react";
import { CheckCircle2, RotateCcw, Eye } from "lucide-react";
import { gradeQuiz, validateQuiz } from "../data/quizzes";

export default function QuizPreview({ quiz }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const error = validateQuiz(
    { ...quiz, status: "Published" },
    { id: quiz.classId },
  );
  if (error)
    return (
      <p className="panel p-6 text-sm text-amber-800">
        Bản nháp chưa đủ nội dung để làm thử: {error}
      </p>
    );
  return (
    <div>
      <div className="instructor-quiz-note" title="Kết quả làm thử không được ghi vào kết quả của sinh viên."><Eye size={16} />Chế độ làm thử</div>
      {result && (
        <div
          role="status"
          className="panel mb-5 flex flex-wrap items-center justify-between gap-4 p-6"
        >
          <div>
            <p className="mb-2 text-sm text-slate-500">Kết quả làm thử</p>
            <p className="text-2xl font-bold text-portal-purple-strong">
              {result.score}/{result.maxScore} điểm
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Đúng {result.correctCount}/{quiz.questions.length} câu
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setAnswers({});
              setResult(null);
            }}
          >
            <RotateCcw size={16} />
            Làm lại
          </button>
        </div>
      )}
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setResult(gradeQuiz(quiz, answers));
        }}
      >
        {quiz.questions.map((question, index) => (
          <fieldset
            key={question.id}
            disabled={Boolean(result)}
            className="panel p-5 sm:p-6"
          >
            <legend className="sr-only">Câu {index + 1}</legend>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900">
                {index + 1}. {question.prompt}
              </h3>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {question.points} điểm
              </span>
            </div>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm ${result && option.id === question.correctOptionId ? "border-portal-line-strong bg-portal-lavender text-portal-ink" : result && answers[question.id] === option.id ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 text-slate-600"}`}
                >
                  <input
                    required
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
                    ? "Trả lời đúng"
                    : "Chưa đúng"}{" "}
                  · Đáp án:{" "}
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
        {!result && (
          <button className="btn-primary" type="submit">
            Nộp bài làm thử
          </button>
        )}
      </form>
    </div>
  );
}
