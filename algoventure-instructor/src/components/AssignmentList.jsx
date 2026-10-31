import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import { formatDate } from "../data/dates.js";
import { canDeleteAssignment } from "../data/validators.js";
import { StatusBadge, EmptyState, ErrorNotice } from "./ui";

export default function AssignmentList({ classroomId }) {
  const { assignments, attempts, deleteAssignment } = useClassrooms();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = assignments.filter(
    (item) =>
      item.classroomId === classroomId &&
      item.title
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  async function remove(item) {
    if (
      !window.confirm(
        `Xóa bài tập “${item.title}”? Bài chưa có lượt làm sẽ được xóa khỏi lớp.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteAssignment(item.id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <input
          className="field sm:max-w-80"
          aria-label="Tìm bài tập"
          placeholder="Tìm tên bài tập..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Link
          className="btn-primary"
          to={`/classes/${classroomId}/assignments/new`}
        >
          <Plus size={17} />
          Tạo bài tập
        </Link>
      </div>
      <ErrorNotice error={error} />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((item) => {
          const history = attempts.filter(
            (attempt) => attempt.assignmentId === item.id,
          );
          const deletable = canDeleteAssignment(item, history);
          return (
            <article className="panel flex flex-col p-6" key={item.id}>
              <div className="mb-4 flex flex-wrap justify-between gap-2">
                <StatusBadge status={item.status} />
                <span className="text-xs text-slate-400">
                  {item.questions.length} câu hỏi
                </span>
              </div>
              <h2 className="break-words text-lg font-bold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {item.description ||
                  "Chọn một đáp án đúng; câu bỏ trống tính là sai."}
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Hạn: {formatDate(item.dueAt)} (giờ Việt Nam)
              </p>
              {item.migrationIssues?.length > 0 && (
                <p className="mt-3 text-xs text-amber-700">
                  Bản nháp chuyển đổi cần kiểm tra câu hỏi.
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link
                  className="btn-secondary"
                  to={`/classes/${classroomId}/assignments/${item.id}`}
                >
                  Xem / Làm thử
                </Link>
                <Link
                  className="btn-secondary"
                  to={`/classes/${classroomId}/assignments/${item.id}/edit`}
                >
                  Chỉnh sửa
                </Link>
                <button
                  className="btn-secondary text-red-600"
                  disabled={busy || !deletable}
                  title={
                    deletable
                      ? "Xóa bài tập"
                      : "Bài đã có lượt làm, không thể xóa"
                  }
                  aria-label={`Xóa bài tập ${item.title}`}
                  onClick={() => remove(item)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {!deletable && (
                <p className="mt-3 text-xs text-slate-400">
                  Đã có {history.length} lượt làm; câu hỏi và thao tác xóa được
                  khóa.
                </p>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <EmptyState title="Chưa có bài tập phù hợp">
          Tạo bài tập trắc nghiệm đầu tiên hoặc thay đổi từ khóa tìm kiếm.
        </EmptyState>
      )}
    </div>
  );
}
