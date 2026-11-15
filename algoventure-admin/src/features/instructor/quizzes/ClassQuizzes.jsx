import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { useClassrooms } from "../workspace/ClassroomContext";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";

export default function ClassQuizzes({ classId, archivedAt }) {
  const text = useText();
  const { quizzes, removeQuiz } = useClassrooms();
  const [error, setError] = useState("");
  const pendingRemovals = useRef(new Set());
  const rows = quizzes.filter((quiz) => quiz.classId === classId);
  async function remove(quiz) {
    if (!canEditQuiz(quiz, archivedAt) || pendingRemovals.current.has(quiz.id)) return;
    if (!window.confirm(`Xóa bản nháp “${quiz.title}”?`)) return;
    pendingRemovals.current.add(quiz.id);
    try {
      await removeQuiz(quiz.id);
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      pendingRemovals.current.delete(quiz.id);
    }
  }
  const pagination = usePagination(rows, classId);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">{text("Bộ câu hỏi trắc nghiệm")}</h2>
        </div>
        {!archivedAt && (
          <Link className="btn-primary" to={`/instructor/classes/${classId}/quizzes/new`}>
            <Plus size={17} />
            {text("Tạo bộ câu hỏi")}
          </Link>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {pagination.items.map((quiz) => (
          <article key={quiz.id} className="panel flex flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <ClipboardList size={21} />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${quiz.archivedAt || quiz.status === "Closed" ? "bg-slate-100 text-slate-600" : quiz.status === "Draft" ? "bg-amber-50 text-amber-700" : "bg-portal-lavender text-portal-purple-strong"}`}
              >
                {text(getQuizStatusLabel(quiz))}
              </span>
            </div>
            <h3 className="mb-2 mt-5 break-words text-lg font-bold text-slate-900">
              {quiz.title}
            </h3>
            {quiz.description && <p className="line-clamp-2 text-sm leading-6 text-slate-500">{quiz.description}</p>}
            <div className="mt-auto flex flex-wrap gap-3 pt-5 text-xs text-slate-500">
              <span>{quiz.questions.length} {text(" câu hỏi")}</span>
              <span>
                {quiz.questions.reduce(
                  (sum, question) => sum + question.points,
                  0,
                )}{" "}
                {text("điểm")}
              </span>
            </div>
            {quiz.due && (
              <p className="mt-2 text-xs text-slate-400">
                {text("Hạn hoàn thành: ")} {quiz.due}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link
                className="btn-secondary"
                to={`/instructor/classes/${classId}/quizzes/${quiz.id}`}
              >
                {text("Xem và làm thử")}
              </Link>
              {canEditQuiz(quiz, archivedAt) && (
                <>
                  <Link
                    className="btn-secondary"
                    to={`/instructor/classes/${classId}/quizzes/${quiz.id}/edit`}
                  >
                    {text("Chỉnh sửa")}
                  </Link>
                  <button
                    className="btn-secondary ml-auto text-red-600"
                    aria-label={`Xóa bộ câu hỏi ${quiz.title}`}
                    onClick={() => remove(quiz)}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      <Pagination pagination={pagination} />
      {!rows.length && (
        <div className="panel p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-800">
            {archivedAt ? text("Lớp chưa có bộ câu hỏi") : text("Soạn bộ câu hỏi đầu tiên")}
          </h3>
          {!archivedAt && (
            <Link className="btn-primary mt-5" to={`/instructor/classes/${classId}/quizzes/new`}>
              <Plus size={17} />
              {text("Tạo bộ câu hỏi")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
