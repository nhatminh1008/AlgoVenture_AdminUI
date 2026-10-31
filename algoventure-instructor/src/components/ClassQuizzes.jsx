import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, FileText, Trash2 } from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";

export default function ClassQuizzes({ classId }) {
  const { quizzes, removeQuiz } = useClassrooms();
  const [error, setError] = useState("");
  const rows = quizzes.filter((quiz) => quiz.classId === classId);
  function remove(quiz) {
    if (!window.confirm(`Xóa bản nháp “${quiz.title}”?`)) return;
    try {
      removeQuiz(quiz.id);
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">Bộ câu hỏi trắc nghiệm</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tự soạn câu hỏi, chọn đáp án đúng và đính kèm tài liệu của lớp.
          </p>
        </div>
        <Link className="btn-primary" to={`/classes/${classId}/quizzes/new`}>
          <Plus size={17} />
          Tạo bộ câu hỏi
        </Link>
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
        {rows.map((quiz) => (
          <article key={quiz.id} className="panel flex flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <ClipboardList size={21} />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${quiz.status === "Draft" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                {quiz.status === "Draft"
                  ? "Bản nháp"
                  : "Đã giao trong bản xem trước"}
              </span>
            </div>
            <h3 className="mb-2 mt-5 break-words text-lg font-bold text-slate-900">
              {quiz.title}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">
              {quiz.description ||
                "Câu hỏi trắc nghiệm do giảng viên biên soạn."}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-5 text-xs text-slate-500">
              <span>{quiz.questions.length} câu hỏi</span>
              <span>
                {quiz.questions.reduce(
                  (sum, question) => sum + question.points,
                  0,
                )}{" "}
                điểm
              </span>
              <span className="flex items-center gap-1">
                <FileText size={13} />
                {quiz.materialIds.length} tài liệu
              </span>
            </div>
            {quiz.due && (
              <p className="mt-2 text-xs text-slate-400">
                Hạn hoàn thành: {quiz.due}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link
                className="btn-secondary"
                to={`/classes/${classId}/quizzes/${quiz.id}`}
              >
                Xem và làm thử
              </Link>
              {quiz.status === "Draft" && (
                <>
                  <Link
                    className="btn-secondary"
                    to={`/classes/${classId}/quizzes/${quiz.id}/edit`}
                  >
                    Chỉnh sửa
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
      {!rows.length && (
        <div className="panel p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-800">
            Soạn bộ câu hỏi đầu tiên
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Bổ sung câu hỏi lý thuyết, dự đoán kết quả hoặc độ phức tạp bên cạnh
            các thử thách game.
          </p>
          <Link
            className="btn-primary mt-5"
            to={`/classes/${classId}/quizzes/new`}
          >
            <Plus size={17} />
            Tạo bộ câu hỏi
          </Link>
        </div>
      )}
    </div>
  );
}
