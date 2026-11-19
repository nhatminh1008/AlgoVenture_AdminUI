import { useActionToast } from "../../../shared/components/useActionToast";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { Eye, Plus, Save, Send } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/useClassrooms";
import { createQuestion, translateQuizError, validateQuiz, MAX_QUESTIONS } from "./quizValidation";
import QuizPreview from "./QuizPreview";
import QuizQuestionEditor from "./QuizQuestionEditor";

export default function QuizEditorForm({ classroom, existing }) {
  const text = useText();
  const toast = useActionToast();
  const { saveQuiz } = useClassrooms();
  const classPath = `/instructor/classes/${classroom.id}`;
  const { open, finish } = useInstructorNavigation();
  const controls = useInstructorParams("editorPage");
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
  const pagination = usePagination(form.questions, form.id, controls);
  const [isSaving, setIsSaving] = useState(false);
  const preview = controls.params.get("preview") === "1" && !validateQuiz({ ...form, status: "Published" }, classroom);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }
  function updateQuestion(id, values) {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question) =>
        question.id === id ? { ...question, ...values } : question,
      ),
    }));
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
    if (isSaving) return;
    const values = { ...form, status };
    const validation = validateQuiz(values, classroom);
    if (validation) {
      toast(translateQuizError(validation, text), true);
      return;
    }
    setIsSaving(true);
    try {
      const quiz = await saveQuiz(values, existing?.id);
      const quizPath = `${classPath}/quizzes/${quiz.id}`;
      finish({
        to: existing ? undefined : quizPath,
        message: status === "Published" ? text("Đã giao bộ câu hỏi cho lớp.") : text("Đã lưu bản nháp bộ câu hỏi."),
      });
    } catch (failure) {
      toast(translateQuizError(failure.message, text), true);
    } finally {
      setIsSaving(false);
    }
  }
  function showPreview() {
    const validation = validateQuiz(
      { ...form, status: "Published" },
      classroom,
    );
    if (validation) toast(translateQuizError(validation, text), true);
    else {
      const params = new URLSearchParams(controls.params);
      params.set("preview", "1");
      open(`${classPath}/quizzes/${existing ? `${existing.id}/edit` : "new"}?${params}`);
    }
  }
  if (controls.params.has("preview") && !preview) {
    return <div className="panel p-8">
      <InstructorBackLink>{text("Quay lại soạn câu hỏi")}</InstructorBackLink>
      <p role="alert">{text("Cần bộ câu hỏi hoàn chỉnh để xem trước.", "Complete the quiz to preview it.")}</p>
    </div>;
  }
  return (
    <div className={`mx-auto max-w-6xl${preview ? "" : " instructor-authoring"}`}>
      <InstructorBackLink>{controls.params.has("preview") ? text("Quay lại soạn câu hỏi") : undefined}</InstructorBackLink>
      <PageHeader
        title={
          preview
            ? text("Làm thử bộ câu hỏi")
            : existing
              ? text("Chỉnh sửa bản nháp")
              : text("Tạo bộ câu hỏi")
        }
      >
        {!preview && (
          <div className="instructor-action-bar quiz-editor-actions flex flex-wrap items-center gap-2">
            <InstructorBackLink plain className="btn-secondary">{text("Hủy", "Cancel")}</InstructorBackLink>
            <button
              className="btn-secondary"
              disabled={isSaving}
              onClick={showPreview}
            >
              <Eye size={16} />
              {text("Xem trước")}
            </button>
            <button
              className="btn-secondary"
              disabled={isSaving}
              onClick={() => save("Draft")}
            >
              <Save size={16} />
              {text("Lưu bản nháp")}
            </button>
            <button
              className="btn-primary"
              disabled={isSaving}
              onClick={() => save("Published")}
            >
              <Send size={16} />
              {isSaving ? text("Đang lưu…") : text("Giao cho lớp")}
            </button>
          </div>
        )}
      </PageHeader>
      {preview ? (
        <QuizPreview quiz={form} />
      ) : (
        <div className="quiz-editor-workspace">
          <section className="instructor-compact-panel panel space-y-5 p-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                {text("Bản nháp · Một đáp án đúng/câu")}
              </span>
            </div>
            <label className="block">
              <span className="field-label">{text("Tên bộ câu hỏi *")}</span>
              <input
                className="field"
                disabled={isSaving}
                maxLength={100}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder={text("VD: Kiểm tra kiến thức Bubble Sort")}
              />
            </label>
            <label className="block">
              <span className="field-label">{text("Hướng dẫn")}</span>
              <textarea
                className="field"
                disabled={isSaving}
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                placeholder={text("Nội dung và mục tiêu của bộ câu hỏi...")}
              />
            </label>
            <label className="block">
              <span className="field-label">{text("Hạn hoàn thành (tùy chọn)")}</span>
              <input
                type="date"
                className="field sm:max-w-64"
                disabled={isSaving}
                value={form.due}
                onChange={(event) => update("due", event.target.value)}
              />
            </label>
          </section>
          <aside className="quiz-editor-summary min-w-0 space-y-5">
            <section className="instructor-compact-panel panel p-5">
              <h2 className="mb-4 font-bold text-slate-900">
                {text("Tổng quan bộ câu hỏi")}
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">{text("Số câu hỏi")}</dt>
                  <dd className="font-semibold">{form.questions.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{text("Tổng điểm")}</dt>
                  <dd className="font-semibold">
                    {form.questions.reduce(
                      (sum, question) => sum + (Number(question.points) || 0),
                      0,
                    )}
                  </dd>
                </div>
              </dl>
              <nav className="quiz-question-nav" aria-label={text("Danh sách câu hỏi")}>{pagination.items.map((question, offset) => <a key={question.id} href={`#question-${question.id}`}>{pagination.page * 10 + offset + 1}</a>)}</nav>
            </section>
          </aside>
          <div className="quiz-editor-questions min-w-0 space-y-5">
            <Pagination pagination={pagination} />
            {pagination.items.map((question, offset) => (
              <QuizQuestionEditor
                key={question.id}
                question={question}
                index={pagination.page * 10 + offset}
                isSaving={isSaving}
                isLast={pagination.page * 10 + offset === form.questions.length - 1}
                onChange={(values) => updateQuestion(question.id, values)}
                onMove={(direction) => move(pagination.page * 10 + offset, direction)}
                onRemove={() =>
                  update("questions", form.questions.filter((item) => item.id !== question.id))
                }
              />
            ))}
            <button
              className="btn-secondary w-full border-dashed"
              disabled={isSaving || form.questions.length >= MAX_QUESTIONS}
              onClick={() => {
                pagination.setPage(Math.floor(form.questions.length / 10));
                update("questions", [...form.questions, createQuestion()]);
              }}
            >
              <Plus size={17} />
              {text("Thêm câu hỏi (")}{form.questions.length}/{MAX_QUESTIONS})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
