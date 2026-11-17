import { useText } from "../../../preferences/preferencesContext";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

export default function QuizQuestionEditor({
  question,
  index,
  isSaving,
  isLast,
  onChange,
  onMove,
  onRemove,
}) {
  const text = useText();
  return (
    <section
      id={`question-${question.id}`}
      className="instructor-compact-panel panel quiz-question-editor p-5 sm:p-6"
      aria-label={text(`Soạn câu ${index + 1}`, `Edit question ${index + 1}`)}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="quiz-question-title"><span>{String(index + 1).padStart(2, "0")}</span>{text("Câu hỏi ")} {index + 1}</h2>
        <div className="quiz-question-controls flex gap-1">
          <button
            className="rounded-lg p-2 hover:bg-slate-50"
            disabled={isSaving || index === 0}
            aria-label={text(`Đưa câu ${index + 1} lên`, `Move question ${index + 1} up`)}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="rounded-lg p-2 hover:bg-slate-50"
            disabled={isSaving || isLast}
            aria-label={text(`Đưa câu ${index + 1} xuống`, `Move question ${index + 1} down`)}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} />
          </button>
          <button
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            disabled={isSaving}
            aria-label={text(`Xóa câu ${index + 1}`, `Delete question ${index + 1}`)}
            onClick={() => {
              if (
                question.prompt.trim() &&
                !window.confirm(text(`Xóa câu ${index + 1}?`, `Delete question ${index + 1}?`))
              )
                return;
              onRemove();
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <label className="mb-5 block">
        <span className="field-label">{text("Nội dung câu hỏi *")}</span>
        <textarea
          className="field"
          disabled={isSaving}
          rows={3}
          maxLength={2000}
          value={question.prompt}
          onChange={(event) =>
            onChange({
              prompt: event.target.value,
            })
          }
          placeholder={text("Nhập câu hỏi về thuật toán hoặc cấu trúc dữ liệu...")}
        />
      </label>
      <fieldset disabled={isSaving}>
        <legend className="field-label">
          {text("Lựa chọn và đáp án đúng")}
        </legend>
        <p className="mb-3 text-sm text-portal-muted">
          {text("Đánh dấu một lựa chọn là đáp án đúng trước khi giao cho lớp.", "Mark one choice as correct before assigning the quiz.")}
        </p>
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => {
            const letter = String.fromCharCode(65 + optionIndex);
            const isCorrect = question.correctOptionId === option.id;
            return (
              <div
                key={option.id}
                className={`quiz-option grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] ${isCorrect ? "border-portal-line-strong bg-portal-lavender/50" : "border-slate-200"}`}
              >
                <span className="text-xs font-bold text-slate-500">{letter}</span>
                <input
                  className="field min-w-0"
                  aria-label={`${text("Lựa chọn", "Choice")} ${letter}`}
                  maxLength={500}
                  value={option.text}
                  onChange={(event) =>
                    onChange({
                      options: question.options.map((item) =>
                        item.id === option.id
                          ? { ...item, text: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
                <label className="quiz-option-correct col-span-2 col-start-2 row-start-2 inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 text-sm font-medium text-portal-purple-strong sm:col-span-1 sm:col-start-3 sm:row-start-1">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    className="h-4 w-4 shrink-0 accent-portal-purple"
                    checked={isCorrect}
                    onChange={() => onChange({ correctOptionId: option.id })}
                  />
                  {isCorrect
                    ? text(`${letter} là đáp án đúng`, `${letter} is correct`)
                    : text(`Đánh dấu ${letter} là đáp án đúng`, `Mark ${letter} as correct`)}
                </label>
                <button
                  disabled={question.options.length <= 2}
                  className="quiz-option-remove col-start-3 row-start-1 p-1 text-slate-400 hover:text-red-500 sm:col-start-4"
                  aria-label={`${text("Xóa lựa chọn", "Delete choice")} ${letter}`}
                  onClick={() =>
                    onChange({
                      options: question.options.filter((item) => item.id !== option.id),
                      correctOptionId: isCorrect ? "" : question.correctOptionId,
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          className="instructor-touch-link mt-3 inline-flex items-center gap-1 text-xs font-semibold text-portal-purple-strong disabled:text-slate-400"
          disabled={question.options.length >= 6}
          onClick={() =>
            onChange({
              options: [
                ...question.options,
                { id: crypto.randomUUID(), text: "" },
              ],
            })
          }
        >
          <Plus size={14} />
          {text("Thêm lựa chọn")}
        </button>
      </fieldset>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_100px]">
        <label>
          <span className="field-label">{text("Giải thích đáp án")}</span>
          <textarea
            className="field"
            disabled={isSaving}
            rows={2}
            maxLength={2000}
            value={question.explanation}
            onChange={(event) =>
              onChange({
                explanation: event.target.value,
              })
            }
            placeholder={text("Vì sao đáp án này đúng?")}
          />
        </label>
        <label>
          <span className="field-label">{text("Điểm")}</span>
          <input
            type="number"
            className="field"
            disabled={isSaving}
            min={1}
            max={20}
            step={1}
            value={question.points}
            onChange={(event) =>
              onChange({
                points:
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value),
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
