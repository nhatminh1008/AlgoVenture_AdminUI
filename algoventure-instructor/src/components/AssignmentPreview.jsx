import { useState } from "react";
import { gradeAttempt } from "../data/metrics.js";
import { validateQuestion } from "../data/validators.js";

export default function AssignmentPreview({ assignment }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  if (
    !assignment.questions.length ||
    assignment.questions.some((question) => validateQuestion(question))
  )
    return (
      <p className="panel p-6 text-sm text-amber-800">
        Bản nháp chưa đủ câu hỏi hợp lệ để làm thử. Cần đúng bốn lựa chọn, đáp
        án đúng và giải thích cho mỗi câu.
      </p>
    );
  return (
    <div>
      <p className="mb-5 rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
        Làm thử của giảng viên, không ghi lượt làm. Có thể bỏ trống câu hỏi; câu
        bỏ trống tính là sai. Giải thích chỉ hiện sau khi nộp.
      </p>
      {result && (
        <div
          role="status"
          className="panel mb-5 flex flex-wrap justify-between gap-3 p-6"
        >
          <div>
            <p className="text-2xl font-bold text-emerald-700">
              {result.scorePercent}%
            </p>
            <p className="mt-2 text-sm">
              Đúng {result.correctCount}/{result.total} câu
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Làm lại
          </button>
        </div>
      )}
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setResult(
            gradeAttempt(
              assignment,
              Object.entries(answers).map(([questionId, selectedIndex]) => ({
                questionId,
                selectedIndex,
              })),
            ),
          );
        }}
      >
        {assignment.questions.map((question, index) => (
          <fieldset
            disabled={Boolean(result)}
            key={question.id}
            className="panel p-6"
          >
            <legend className="sr-only">Câu {index + 1}</legend>
            <h3 className="mb-4 whitespace-pre-wrap break-words font-semibold leading-6">
              {index + 1}. {question.prompt}
            </h3>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${result && optionIndex === question.correctIndex ? "border-emerald-300 bg-emerald-50" : result && answers[question.id] === optionIndex ? "border-red-200 bg-red-50" : "border-slate-200"}`}
                >
                  <input
                    type="radio"
                    className="mt-1 accent-emerald-600"
                    name={`answer-${question.id}`}
                    checked={answers[question.id] === optionIndex}
                    onChange={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: optionIndex,
                      }))
                    }
                  />
                  <span className="shrink-0 font-bold">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            {!result && answers[question.id] !== undefined && (
              <button
                type="button"
                className="mt-3 text-xs text-slate-500 underline"
                onClick={() =>
                  setAnswers((previous) => ({
                    ...previous,
                    [question.id]: null,
                  }))
                }
              >
                Bỏ trống câu này
              </button>
            )}
            {result && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6">
                <p className="font-semibold">
                  {answers[question.id] === question.correctIndex
                    ? "Đúng"
                    : "Sai hoặc bỏ trống"}{" "}
                  · Đáp án {String.fromCharCode(65 + question.correctIndex)}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-slate-500">
                  {question.explanation}
                </p>
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
