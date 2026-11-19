import { useActionToast } from "../../../shared/components/useActionToast";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useText } from "../../../preferences/preferencesContext";
import { useRef } from "react";
import InstructorLink from "../workspace/InstructorLink";
import { progressResultsPath } from "../workspace/useInstructorNavigation";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { ClipboardList, Eye, FilePenLine, Plus, Trash2 } from "lucide-react";
import { useClassrooms } from "../workspace/useClassrooms";
import { canEditQuiz, getQuizStatusLabel } from "./quizStatus";

export default function ClassQuizzes({ classId }) {
  const text = useText();
  const toast = useActionToast();
  const { classes, quizzes, removeQuiz } = useClassrooms();
  const pendingRemovals = useRef(new Set());
  const rows = classId ? quizzes.filter((quiz) => quiz.classId === classId) : quizzes;
  const classroom = classes.find((item) => item.id === classId);
  const addQuizPath = classroom && !classroom.archivedAt ? `/instructor/classes/${classId}/quizzes/new` : null;
  const archived = (quiz) => classes.find((item) => item.id === quiz.classId)?.archivedAt;
  async function remove(quiz) {
    if (!canEditQuiz(quiz, archived(quiz)) || pendingRemovals.current.has(quiz.id)) return;
    if (!window.confirm(text(`Xóa bản nháp “${quiz.title}”?`, `Delete draft “${quiz.title}”?`))) return;
    pendingRemovals.current.add(quiz.id);
    try {
      await removeQuiz(quiz.id);
      toast(text("Đã xóa bản nháp bộ câu hỏi.", "Quiz draft deleted."));
    } catch (failure) {
      toast(failure.message, true);
    } finally {
      pendingRemovals.current.delete(quiz.id);
    }
  }
  const pagination = usePagination(rows, classId, useInstructorParams("quizPage"));
  const columns = [
    {
      key: "title", title: text("Tên bộ câu hỏi", "Quiz name"), layout: "primary",
      render: (quiz) => <>
        <div className="font-semibold text-slate-900 wrap-anywhere">{quiz.title}</div>
        {quiz.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 wrap-anywhere">{quiz.description}</p>}
      </>,
    },
    ...(!classId ? [{ key: "class", title: text("Lớp học"), render: (quiz) => classes.find((item) => item.id === quiz.classId)?.name }] : []),
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
        const quizUrl = `/instructor/classes/${quiz.classId}/quizzes/${quiz.id}`;
        return (
          <div className="table-actions">
            {quiz.status !== "Draft" && <InstructorLink className="btn-row-action" aria-label={`${text("Xem kết quả", "View results")} · ${quiz.title}`}
              to={progressResultsPath(quiz.classId, "quizzes", quiz.id)}>{text("Xem kết quả", "View results")}</InstructorLink>}
            <InstructorLink className="btn-row-action" aria-label={`${text("Xem và làm thử")}: ${quiz.title}`} to={`${quizUrl}?tab=preview`}>
              <Eye aria-hidden="true" />{text("Xem và làm thử")}
            </InstructorLink>
            {canEditQuiz(quiz, archived(quiz)) && <>
              <InstructorLink className="btn-row-action" aria-label={`${text("Chỉnh sửa")}: ${quiz.title}`} to={`${quizUrl}/edit`}>
                <FilePenLine aria-hidden="true" />{text("Chỉnh sửa")}
              </InstructorLink>
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
        {addQuizPath && (
          <InstructorLink className="btn-primary" to={addQuizPath}>
            <Plus size={17} />
            {text("Tạo bộ câu hỏi")}
          </InstructorLink>
        )}
      </div>
      {rows.length ? (
        <div className="panel overflow-hidden">
          <RecordTable label={text("Bộ câu hỏi trắc nghiệm")} columns={columns} rows={pagination.items} />
          <Pagination pagination={pagination} />
        </div>
      ) : (
        <div className="panel p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-800">
            {classroom ? text("Lớp chưa có bộ câu hỏi") : text("Chưa có bộ câu hỏi")}
          </h3>
          {addQuizPath && (
            <InstructorLink className="btn-primary mt-5" to={addQuizPath}>
              <Plus size={17} />
              {text("Tạo bộ câu hỏi")}
            </InstructorLink>
          )}
        </div>
      )}
    </div>
  );
}
