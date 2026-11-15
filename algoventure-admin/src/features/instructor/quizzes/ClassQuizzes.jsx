import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Eye, FilePenLine, Plus, Trash2 } from "lucide-react";
import { useClassrooms } from "../workspace/ClassroomContext";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";

export default function ClassQuizzes({ classId, archivedAt }) {
  const text = useText();
  const { quizzes, removeQuiz } = useClassrooms();
  const [error, setError] = useState("");
  const pendingRemovals = useRef(new Set());
  const rows = quizzes.filter((quiz) => quiz.classId === classId);
  const quizBase = `/instructor/classes/${classId}/quizzes`;
  const { childState } = useInstructorNavigation();
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
  const columns = [
    {
      key: "title", title: text("Tên bộ câu hỏi", "Quiz name"), layout: "primary",
      render: (quiz) => <>
        <div className="font-semibold text-slate-900 wrap-anywhere">{quiz.title}</div>
        {quiz.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 wrap-anywhere">{quiz.description}</p>}
      </>,
    },
    { key: "questions", title: text("Số câu hỏi"), render: (quiz) => quiz.questions.length },
    { key: "points", title: text("Tổng điểm"), render: (quiz) => quiz.questions.reduce((sum, question) => sum + question.points, 0) },
    { key: "due", title: text("Hạn hoàn thành"), render: (quiz) => quiz.due || text("Chưa đặt") },
    {
      key: "status", title: text("Trạng thái"),
      render: (quiz) => {
        const badgeClass = quiz.archivedAt || quiz.status === "Closed"
          ? "instructor-badge-closed"
          : quiz.status === "Draft" ? "instructor-badge-draft" : "";
        return <span className={`instructor-badge ${badgeClass}`}>{text(getQuizStatusLabel(quiz))}</span>;
      },
    },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (quiz) => {
        const quizUrl = `${quizBase}/${quiz.id}`;
        return (
          <div className="table-actions">
            <Link className="btn-row-action" aria-label={`${text("Xem và làm thử")}: ${quiz.title}`} to={quizUrl} state={childState}>
              <Eye aria-hidden="true" />{text("Xem và làm thử")}
            </Link>
            {canEditQuiz(quiz, archivedAt) && <>
              <Link className="btn-row-action" aria-label={`${text("Chỉnh sửa")}: ${quiz.title}`} to={`${quizUrl}/edit`} state={childState}>
                <FilePenLine aria-hidden="true" />{text("Chỉnh sửa")}
              </Link>
              <button type="button" className="btn-row-action btn-row-action-icon btn-row-action-danger"
                aria-label={`${text("Xóa bộ câu hỏi", "Delete quiz")}: ${quiz.title}`} onClick={() => remove(quiz)}>
                <Trash2 aria-hidden="true" />
              </button>
            </>}
          </div>
        );
      },
    },
  ];
  return (
    <div>
      <div className="instructor-section-actions mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">{text("Bộ câu hỏi trắc nghiệm")}</h2>
        </div>
        {!archivedAt && (
          <Link className="btn-primary" to={`${quizBase}/new`} state={childState}>
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
      {rows.length ? (
        <div className="panel overflow-hidden">
          <RecordTable label={text("Bộ câu hỏi trắc nghiệm")} columns={columns} rows={pagination.items} />
          <Pagination pagination={pagination} />
        </div>
      ) : (
        <div className="panel p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-800">
            {archivedAt ? text("Lớp chưa có bộ câu hỏi") : text("Soạn bộ câu hỏi đầu tiên")}
          </h3>
          {!archivedAt && (
            <Link className="btn-primary mt-5" to={`${quizBase}/new`} state={childState}>
              <Plus size={17} />
              {text("Tạo bộ câu hỏi")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
