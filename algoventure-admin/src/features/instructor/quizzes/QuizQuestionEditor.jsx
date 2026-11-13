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
  return (
    <section
      id={`question-${question.id}`}
      className="panel quiz-question-editor p-5 sm:p-6"
      aria-label={`Soạn câu ${index + 1}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="quiz-question-title"><span>{String(index + 1).padStart(2, "0")}</span>Câu hỏi {index + 1}</h2>
        <div className="flex gap-1">
          <button
            className="rounded-lg p-2 hover:bg-slate-50"
            disabled={isSaving || index === 0}
            aria-label={`Đưa câu ${index + 1} lên`}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="rounded-lg p-2 hover:bg-slate-50"
            disabled={isSaving || isLast}
            aria-label={`Đưa câu ${index + 1} xuống`}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} />
          </button>
          <button
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            disabled={isSaving}
            aria-label={`Xóa câu ${index + 1}`}
            onClick={() => {
              if (
                question.prompt.trim() &&
                !window.confirm(`Xóa câu ${index + 1}?`)
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
        <span className="field-label">Nội dung câu hỏi *</span>
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
          placeholder="Nhập câu hỏi về thuật toán hoặc cấu trúc dữ liệu..."
        />
      </label>
      <fieldset disabled={isSaving}>
        <legend className="field-label">
          Lựa chọn và đáp án đúng
        </legend>
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <div
              key={option.id}
              className={`flex items-center gap-2 rounded-xl border p-3 ${question.correctOptionId === option.id ? "border-portal-line-strong bg-portal-lavender/50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name={`correct-${question.id}`}
                aria-label={`Đáp án đúng ${String.fromCharCode(65 + optionIndex)}`}
                className="h-4 w-4 shrink-0 accent-portal-purple"
                checked={question.correctOptionId === option.id}
                onChange={() =>
                  onChange({
                    correctOptionId: option.id,
                  })
                }
              />
              <span className="text-xs font-bold text-slate-500">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <input
                className="field min-w-0 flex-1"
                aria-label={`Lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
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
              <button
                disabled={question.options.length <= 2}
                className="shrink-0 p-1 text-slate-400 hover:text-red-500"
                aria-label={`Xóa lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                onClick={() =>
                  onChange({
                    options: question.options.filter(
                      (item) => item.id !== option.id,
                    ),
                    correctOptionId:
                      question.correctOptionId === option.id
                        ? ""
                        : question.correctOptionId,
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-portal-purple-strong disabled:text-slate-400"
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
          Thêm lựa chọn
        </button>
      </fieldset>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_100px]">
        <label>
          <span className="field-label">Giải thích đáp án</span>
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
            placeholder="Vì sao đáp án này đúng?"
          />
        </label>
        <label>
          <span className="field-label">Điểm</span>
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
