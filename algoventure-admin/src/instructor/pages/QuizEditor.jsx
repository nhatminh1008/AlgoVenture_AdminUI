import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Save,
  Send,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { createQuestion, validateQuiz, MAX_QUESTIONS } from "../data/quizzes";
import { getTopic } from "../data/curriculum";
import { useMaterialList } from "../components/ClassMaterials";
import QuizPreview from "../components/QuizPreview";

export default function QuizEditor() {
  const { classId, quizId } = useParams();
  const { classes, quizzes } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const existing = quizzes.find(
    (item) => item.id === quizId && item.classId === classId,
  );
  if (!classroom || (quizId && !existing))
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          Không tìm thấy lớp hoặc bộ câu hỏi
        </h1>
        <Link className="btn-secondary mt-4" to="/instructor/classes">
          Về lớp của tôi
        </Link>
      </div>
    );
  if (existing?.status === "Published")
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">Bộ câu hỏi đã được công bố</h1>
        <p className="mt-3 text-sm text-slate-500">
          Nội dung được giữ nguyên để bảo toàn yêu cầu đã giao.
        </p>
        <Link
          className="btn-secondary mt-4"
          to={`/instructor/classes/${classId}/quizzes/${quizId}`}
        >
          Xem bộ câu hỏi
        </Link>
      </div>
    );
  return (
    <Editor
      key={`${classId}:${quizId ?? "new"}`}
      classroom={classroom}
      existing={existing}
    />
  );
}

function Editor({ classroom, existing }) {
  const { saveQuiz } = useClassrooms();
  const navigate = useNavigate();
  const {
    materials,
    loading: materialLoading,
    error: materialError,
    refresh: refreshMaterials,
  } = useMaterialList(classroom.id);
  const [form, setForm] = useState(() =>
    existing
      ? structuredClone(existing)
      : {
          classId: classroom.id,
          title: "",
          description: "",
          due: "",
          status: "Draft",
          materialIds: [],
          questions: [createQuestion()],
        },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  function updateQuestion(id, values) {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question) =>
        question.id === id ? { ...question, ...values } : question,
      ),
    }));
    setError("");
  }
  function move(index, direction) {
    const questions = [...form.questions];
    [questions[index], questions[index + direction]] = [
      questions[index + direction],
      questions[index],
    ];
    update("questions", questions);
  }
  async function save(status) {
    if (busy) return;
    const values = { ...form, status };
    const validation = validateQuiz(values, classroom);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const quiz = await saveQuiz(values, existing?.id);
      navigate(`/instructor/classes/${classroom.id}/quizzes/${quiz.id}`, {
        state: {
          message:
            status === "Published"
              ? "Đã công bố bộ câu hỏi trên server. Game cần tích hợp API để sinh viên nhận bài."
              : "Đã lưu bản nháp bộ câu hỏi.",
        },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function showPreview() {
    const validation = validateQuiz(
      { ...form, status: "Published" },
      classroom,
    );
    if (validation) setError(validation);
    else {
      setError("");
      setPreview(true);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500"
        to={`/instructor/classes/${classroom.id}?tab=quizzes`}
      >
        <ArrowLeft size={16} />
        Trắc nghiệm của lớp
      </Link>
      <PageHeader
        breadcrumb={`${classroom.name} / Trắc nghiệm`}
        title={
          preview
            ? "Làm thử bộ câu hỏi"
            : existing
              ? "Chỉnh sửa bản nháp"
              : "Tạo bộ câu hỏi"
        }
      >
        {preview ? (
          <button className="btn-secondary" onClick={() => setPreview(false)}>
            Quay lại soạn câu hỏi
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
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => save("Draft")}
            >
              <Save size={16} />
              Lưu bản nháp
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => save("Published")}
            >
              <Send size={16} />
              {busy ? "Đang lưu…" : "Giao cho lớp"}
            </button>
          </>
        )}
      </PageHeader>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {preview ? (
        <QuizPreview quiz={form} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <section className="panel space-y-5 p-6">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {getTopic(classroom.topicId).name}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  Bản nháp · Một đáp án đúng/câu
                </span>
              </div>
              <label className="block">
                <span className="field-label">Tên bộ câu hỏi *</span>
                <input
                  className="field"
                  disabled={busy}
                  maxLength={100}
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="VD: Kiểm tra kiến thức Bubble Sort"
                />
              </label>
              <label className="block">
                <span className="field-label">Hướng dẫn</span>
                <textarea
                  className="field"
                  disabled={busy}
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  placeholder="Nội dung và mục tiêu của bộ câu hỏi..."
                />
              </label>
              <label className="block">
                <span className="field-label">Hạn hoàn thành (tùy chọn)</span>
                <input
                  type="date"
                  className="field sm:max-w-64"
                  disabled={busy}
                  value={form.due}
                  onChange={(event) => update("due", event.target.value)}
                />
              </label>
            </section>
            {form.questions.map((question, index) => (
              <section
                key={question.id}
                className="panel p-5 sm:p-6"
                aria-label={`Soạn câu ${index + 1}`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-slate-900">Câu {index + 1}</h2>
                  <div className="flex gap-1">
                    <button
                      className="rounded-lg p-2 hover:bg-slate-50"
                      disabled={busy || index === 0}
                      aria-label={`Đưa câu ${index + 1} lên`}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 hover:bg-slate-50"
                      disabled={busy || index === form.questions.length - 1}
                      aria-label={`Đưa câu ${index + 1} xuống`}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      disabled={busy}
                      aria-label={`Xóa câu ${index + 1}`}
                      onClick={() => {
                        if (
                          question.prompt.trim() &&
                          !window.confirm(`Xóa câu ${index + 1}?`)
                        )
                          return;
                        update(
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
                    className="field"
                    disabled={busy}
                    rows={3}
                    maxLength={2000}
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        prompt: event.target.value,
                      })
                    }
                    placeholder="Nhập câu hỏi về thuật toán hoặc cấu trúc dữ liệu..."
                  />
                </label>
                <fieldset disabled={busy}>
                  <legend className="field-label">
                    Lựa chọn và đáp án đúng
                  </legend>
                  <p className="mb-3 text-xs text-slate-400">
                    Chọn vòng tròn bên cạnh lựa chọn đúng. Mỗi câu có từ 2 đến 6
                    lựa chọn.
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 rounded-xl border p-3 ${question.correctOptionId === option.id ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}
                      >
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          aria-label={`Đáp án đúng ${String.fromCharCode(65 + optionIndex)}`}
                          className="h-4 w-4 shrink-0 accent-emerald-600"
                          checked={question.correctOptionId === option.id}
                          onChange={() =>
                            updateQuestion(question.id, {
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
                            updateQuestion(question.id, {
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
                            updateQuestion(question.id, {
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
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 disabled:text-slate-400"
                    disabled={question.options.length >= 6}
                    onClick={() =>
                      updateQuestion(question.id, {
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
                      disabled={busy}
                      rows={2}
                      maxLength={2000}
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(question.id, {
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
                      disabled={busy}
                      min={1}
                      max={20}
                      step={1}
                      value={question.points}
                      onChange={(event) =>
                        updateQuestion(question.id, {
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
            ))}
            <button
              className="btn-secondary w-full border-dashed"
              disabled={busy || form.questions.length >= MAX_QUESTIONS}
              onClick={() =>
                update("questions", [...form.questions, createQuestion()])
              }
            >
              <Plus size={17} />
              Thêm câu hỏi ({form.questions.length}/{MAX_QUESTIONS})
            </button>
          </div>
          <aside className="min-w-0 space-y-5">
            <section className="panel p-5">
              <h2 className="mb-4 font-bold text-slate-900">
                Tổng quan bộ câu hỏi
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Số câu hỏi</dt>
                  <dd className="font-semibold">{form.questions.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tổng điểm</dt>
                  <dd className="font-semibold">
                    {form.questions.reduce(
                      (sum, question) => sum + (Number(question.points) || 0),
                      0,
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                Có thể lưu bản nháp khi chưa hoàn thiện. Khi giao cho lớp, mọi
                câu hỏi phải có nội dung và một đáp án đúng.
              </p>
            </section>
            <section className="panel p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <FileText size={17} />
                Tài liệu tham khảo
              </h2>
              <p className="my-3 text-xs leading-5 text-slate-500">
                Chọn tài liệu đã tải lên trong lớp này.
              </p>
              {materialLoading ? (
                <p className="text-xs text-slate-400">Đang tải tài liệu…</p>
              ) : materialError ? (
                <p role="alert" className="text-xs text-red-600">
                  {materialError}
                </p>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <label
                      key={material.id}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <input
                        disabled={busy}
                        type="checkbox"
                        className="mt-1 accent-emerald-600"
                        checked={form.materialIds.includes(material.id)}
                        onChange={() =>
                          update(
                            "materialIds",
                            form.materialIds.includes(material.id)
                              ? form.materialIds.filter(
                                  (id) => id !== material.id,
                                )
                              : [...form.materialIds, material.id],
                          )
                        }
                      />
                      <span className="min-w-0 break-words">
                        {material.title}
                      </span>
                    </label>
                  ))}
                  {!materials.length && (
                    <p className="text-xs text-slate-400">
                      Lớp chưa có tài liệu.
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                className="mt-3 block text-xs font-semibold text-emerald-700"
                disabled={materialLoading}
                onClick={refreshMaterials}
              >
                Làm mới danh sách tài liệu
              </button>
              <Link
                className="mt-4 inline-flex text-xs font-semibold text-emerald-700"
                target="_blank"
                rel="noreferrer"
                to={`/instructor/classes/${classroom.id}?tab=materials`}
              >
                Mở tài liệu của lớp ↗
              </Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
