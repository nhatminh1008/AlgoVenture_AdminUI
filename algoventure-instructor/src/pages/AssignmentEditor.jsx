import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  Save,
  Send,
} from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import {
  createQuestion,
  questionsLocked,
  validateQuestion,
} from "../data/validators.js";
import { PORTAL_POLICY } from "../data/policy.js";
import { toDueInput, fromDueInput, defaultDueInput } from "../data/dates.js";
import {
  PageHeader,
  LoadState,
  EmptyState,
  ErrorNotice,
} from "../components/ui";
import AssignmentPreview from "../components/AssignmentPreview";

export default function AssignmentEditor() {
  const data = useClassrooms();
  const { classId, assignmentId } = useParams();
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const classroom = data.classrooms.find((item) => item.id === classId);
  const existing = data.assignments.find(
    (item) => item.id === assignmentId && item.classroomId === classId,
  );
  if (!classroom || (assignmentId && !existing))
    return (
      <EmptyState
        title="Không tìm thấy lớp hoặc bài tập"
        action={
          <Link className="btn-secondary" to="/classes">
            Về lớp học
          </Link>
        }
      />
    );
  return (
    <Editor
      key={`${classId}:${assignmentId ?? "new"}`}
      classroom={classroom}
      existing={existing}
    />
  );
}
function Editor({ classroom, existing }) {
  const data = useClassrooms();
  const navigate = useNavigate();
  const [form, setForm] = useState(() =>
    existing
      ? structuredClone(existing)
      : {
          classroomId: classroom.id,
          title: "",
          description: "",
          dueAt: "",
          status: "draft",
          questions: [createQuestion()],
        },
  );
  const [dueInput, setDueInput] = useState(() =>
    existing?.dueAt ? toDueInput(existing.dueAt) : defaultDueInput(data.now),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const locked = questionsLocked(
    data.attempts.filter((item) => item.assignmentId === existing?.id),
  );
  const set = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };
  function updateQuestion(id, values) {
    set(
      "questions",
      form.questions.map((question) =>
        question.id === id ? { ...question, ...values } : question,
      ),
    );
  }
  function move(index, step) {
    const questions = [...form.questions];
    [questions[index], questions[index + step]] = [
      questions[index + step],
      questions[index],
    ];
    set("questions", questions);
  }
  async function save(status) {
    setBusy(true);
    setError("");
    try {
      const dueAt =
        existing?.dueAt && dueInput === toDueInput(existing.dueAt)
          ? existing.dueAt
          : dueInput
            ? fromDueInput(dueInput)
            : "";
      const item = await data.saveAssignment(
        { ...form, status, dueAt },
        existing?.id,
      );
      navigate(`/classes/${classroom.id}/assignments/${item.id}`, {
        state: {
          message:
            status === "draft"
              ? "Đã lưu bản nháp."
              : "Đã lưu bài tập đã giao trong kho cục bộ.",
        },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function showPreview() {
    const invalid = form.questions
      .map((question) => validateQuestion(question))
      .find(Boolean);
    if (!form.questions.length || invalid)
      setError(invalid || "Thêm ít nhất một câu hỏi để làm thử.");
    else {
      setError("");
      setPreview(true);
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="mb-5 inline-block text-sm text-emerald-700"
        to={`/classes/${classroom.id}`}
      >
        ← Bài tập của lớp
      </Link>
      <PageHeader
        breadcrumb={`${classroom.title} / Bài tập`}
        title={
          preview
            ? "Làm thử bài tập"
            : existing
              ? "Chỉnh sửa bài tập"
              : "Tạo bài tập"
        }
      >
        {preview ? (
          <button className="btn-secondary" onClick={() => setPreview(false)}>
            Quay lại soạn bài
          </button>
        ) : (
          <>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={showPreview}
            >
              <Eye size={16} />
              Xem trước
            </button>
            {!locked && (
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() => save("draft")}
              >
                <Save size={16} />
                Lưu nháp
              </button>
            )}
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => save("published")}
            >
              <Send size={16} />
              {busy
                ? "Đang lưu…"
                : existing?.status === "published"
                  ? "Lưu thay đổi"
                  : "Giao bài"}
            </button>
          </>
        )}
      </PageHeader>
      <ErrorNotice error={error} />
      {preview ? (
        <AssignmentPreview assignment={form} />
      ) : (
        <div className="space-y-5">
          {locked && (
            <p
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
            >
              Bài tập đã có lượt làm. Câu hỏi, thứ tự, lựa chọn, đáp án và giải
              thích được khóa; bạn vẫn có thể sửa tên, hướng dẫn và hạn hoàn
              thành.
            </p>
          )}
          {existing?.migrationIssues?.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <p className="font-semibold">Bản nháp chuyển đổi cần kiểm tra</p>
              <ul className="mt-2 list-disc pl-5">
                {existing.migrationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="panel space-y-5 p-6">
            <label className="block">
              <span className="field-label">Tên bài tập *</span>
              <input
                className="field"
                maxLength={100}
                disabled={busy}
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="field-label">Hướng dẫn</span>
              <textarea
                className="field"
                rows={3}
                maxLength={1000}
                disabled={busy}
                value={form.description ?? ""}
                onChange={(event) => set("description", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="field-label">
                Hạn hoàn thành — giờ Việt Nam *
              </span>
              <input
                className="field sm:max-w-80"
                type="datetime-local"
                disabled={busy}
                value={dueInput}
                onChange={(event) => setDueInput(event.target.value)}
              />
            </label>
            <p className="text-xs text-slate-500">
              Múi giờ Asia/Ho_Chi_Minh. Mặc định {PORTAL_POLICY.defaultDueTime};
              hạn phải ở tương lai khi giao bài hoặc thay đổi hạn.
            </p>
          </section>
          {form.questions.map((question, index) => (
            <fieldset
              key={question.id}
              disabled={busy || locked}
              className="panel p-5 sm:p-6"
            >
              <legend className="sr-only">Soạn câu {index + 1}</legend>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-bold">Câu {index + 1}</h2>
                <div className="flex gap-1">
                  <button
                    className="p-2"
                    disabled={busy || locked || index === 0}
                    aria-label={`Đưa câu ${index + 1} lên`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="p-2"
                    disabled={
                      busy || locked || index === form.questions.length - 1
                    }
                    aria-label={`Đưa câu ${index + 1} xuống`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="p-2 text-red-500"
                    aria-label={`Xóa câu ${index + 1}`}
                    onClick={() => {
                      if (
                        !question.prompt ||
                        window.confirm(`Xóa câu ${index + 1}?`)
                      )
                        set(
                          "questions",
                          form.questions.filter(
                            (item) => item.id !== question.id,
                          ),
                        );
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <label className="mb-5 block">
                <span className="field-label">Nội dung câu hỏi *</span>
                <textarea
                  rows={3}
                  className="field"
                  maxLength={2000}
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(question.id, { prompt: event.target.value })
                  }
                />
              </label>
              {question.options.length !== PORTAL_POLICY.optionsPerQuestion && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
                >
                  Câu cũ có {question.options.length} lựa chọn. Hãy tự chọn lựa
                  chọn cần giữ hoặc bổ sung để còn đúng 4; hệ thống không tự cắt
                  hoặc thêm đáp án.
                </p>
              )}
              <p className="mb-3 text-xs text-slate-500">
                Chọn một đáp án đúng. Mỗi câu có đúng 4 lựa chọn.
              </p>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${question.correctIndex === optionIndex ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200"}`}
                  >
                    <input
                      type="radio"
                      className="shrink-0 accent-emerald-600"
                      name={`correct-${question.id}`}
                      aria-label={`Đáp án đúng ${String.fromCharCode(65 + optionIndex)}`}
                      checked={question.correctIndex === optionIndex}
                      onChange={() =>
                        updateQuestion(question.id, {
                          correctIndex: optionIndex,
                        })
                      }
                    />
                    <span className="text-xs font-bold">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <input
                      className="field min-w-0 flex-1"
                      aria-label={`Lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                      maxLength={500}
                      value={option}
                      onChange={(event) =>
                        updateQuestion(question.id, {
                          options: question.options.map((value, i) =>
                            i === optionIndex ? event.target.value : value,
                          ),
                        })
                      }
                    />
                    {question.options.length >
                      PORTAL_POLICY.optionsPerQuestion && (
                      <button
                        className="text-red-500"
                        aria-label={`Bỏ lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                        onClick={() =>
                          updateQuestion(question.id, {
                            options: question.options.filter(
                              (_, i) => i !== optionIndex,
                            ),
                            correctIndex:
                              question.correctIndex === optionIndex
                                ? -1
                                : question.correctIndex > optionIndex
                                  ? question.correctIndex - 1
                                  : question.correctIndex,
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.options.length < PORTAL_POLICY.optionsPerQuestion && (
                <button
                  className="btn-secondary mt-3"
                  onClick={() =>
                    updateQuestion(question.id, {
                      options: [...question.options, ""],
                    })
                  }
                >
                  Thêm lựa chọn còn thiếu
                </button>
              )}
              <label className="mt-5 block">
                <span className="field-label">Giải thích đáp án *</span>
                <textarea
                  rows={3}
                  className="field"
                  maxLength={2000}
                  value={question.explanation}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      explanation: event.target.value,
                    })
                  }
                />
              </label>
            </fieldset>
          ))}
          {!locked && (
            <button
              className="btn-secondary w-full border-dashed"
              disabled={
                busy || form.questions.length >= PORTAL_POLICY.maxQuestions
              }
              onClick={() =>
                set("questions", [...form.questions, createQuestion()])
              }
            >
              <Plus size={17} />
              Thêm câu hỏi ({form.questions.length}/{PORTAL_POLICY.maxQuestions}
              )
            </button>
          )}
        </div>
      )}
    </div>
  );
}
