import { useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import { formatDate } from "../data/dates.js";
import {
  PageHeader,
  LoadState,
  EmptyState,
  ErrorNotice,
} from "../components/ui";
import AssignmentList from "../components/AssignmentList";

export default function ClassDetail() {
  const data = useClassrooms();
  const { classId } = useParams();
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const classroom = data.classrooms.find((item) => item.id === classId);
  if (!classroom)
    return (
      <EmptyState
        title="Không tìm thấy lớp học"
        action={
          <Link to="/classes" className="btn-secondary">
            Về lớp học
          </Link>
        }
      />
    );
  return <Detail key={classId} classroom={classroom} />;
}
function Detail({ classroom }) {
  const data = useClassrooms();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const input = useRef(null);
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const tab = params.get("tab") === "learners" ? "learners" : "assignments";
  const members = data.enrollments.filter(
    (item) => item.classroomId === classroom.id,
  );
  const assignments = data.assignments.filter(
    (item) => item.classroomId === classroom.id,
  );
  const history = data.attempts.filter((item) =>
    assignments.some((assignment) => assignment.id === item.assignmentId),
  );
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(classroom.inviteCode);
      setMessage("Đã sao chép mã mời.");
    } catch {
      input.current.focus();
      input.current.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        /* Manual selection remains available. */
      }
      setMessage(
        copied
          ? "Đã sao chép mã mời."
          : "Đã chọn mã mời. Nhấn Ctrl+C / Command+C hoặc chạm giữ để sao chép.",
      );
    }
  }
  async function remove() {
    if (
      !window.confirm(
        `Xóa lớp “${classroom.title}”? Thao tác này xóa ${members.length} lượt tham gia, ${assignments.length} bài tập và ${history.length} lượt làm. Không thể hoàn tác.`,
      )
    )
      return;
    setBusy(true);
    try {
      await data.deleteClassroom(classroom.id);
      navigate("/classes");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function selectTab(next, focus = false) {
    setParams({ tab: next });
    if (focus) document.getElementById(`tab-${next}`)?.focus();
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader breadcrumb="Lớp học / Chi tiết" title={classroom.title}>
        <Link className="btn-secondary" to={`/classes/${classroom.id}/edit`}>
          <Pencil size={16} />
          Sửa lớp
        </Link>
        <button
          className="btn-secondary text-red-600"
          disabled={busy}
          onClick={remove}
        >
          <Trash2 size={16} />
          Xóa lớp
        </button>
      </PageHeader>
      <ErrorNotice error={error} />
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
      <section className="panel mb-6 p-6">
        <p className="mb-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
          {classroom.description || "Chào mừng đến với lớp học DSA."}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-5">
          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-emerald-700"
              htmlFor="invite-code"
            >
              Mã mời tham gia lớp
            </label>
            <input
              id="invite-code"
              ref={input}
              readOnly
              className="w-48 bg-transparent font-mono text-2xl font-bold tracking-widest text-slate-900"
              value={classroom.inviteCode}
            />
            <p className="mt-2 text-xs text-slate-500">
              Học viên nhập mã này trong game để tham gia.
            </p>
          </div>
          <button className="btn-secondary" onClick={copy}>
            <Copy size={16} />
            Sao chép mã
          </button>
        </div>
        <p className="mt-5 text-xs text-slate-500">
          {members.length} học viên · {assignments.length} bài tập ·{" "}
          {classroom.instructorName}
        </p>
      </section>
      <div
        className="mb-5 flex gap-3 border-b border-slate-200"
        role="tablist"
        aria-label="Nội dung lớp"
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            selectTab(
              event.key === "Home"
                ? "assignments"
                : event.key === "End"
                  ? "learners"
                  : tab === "assignments"
                    ? "learners"
                    : "assignments",
              true,
            );
          }
        }}
      >
        {[
          ["assignments", "Bài tập"],
          ["learners", "Học viên"],
        ].map(([id, label]) => (
          <button
            id={`tab-${id}`}
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls="class-panel"
            tabIndex={tab === id ? 0 : -1}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === id ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500"}`}
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <section id="class-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "assignments" ? (
          <AssignmentList classroomId={classroom.id} />
        ) : (
          <div className="panel overflow-hidden">
            <div className="p-5">
              <input
                aria-label="Tìm học viên"
                className="field"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên hoặc email..."
              />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Email</th>
                    <th>Tham gia (giờ Việt Nam)</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .filter((item) =>
                      `${item.learnerName} ${item.learnerEmail}`
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase()),
                    )
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link
                            className="font-semibold text-emerald-700"
                            to={`/classes/${classroom.id}/learners/${item.learnerId}`}
                          >
                            {item.learnerName}
                          </Link>
                        </td>
                        <td>{item.learnerEmail}</td>
                        <td className="whitespace-nowrap">
                          {formatDate(item.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  {!members.some((item) =>
                    `${item.learnerName} ${item.learnerEmail}`
                      .toLocaleLowerCase()
                      .includes(search.toLocaleLowerCase()),
                  ) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-slate-500"
                      >
                        Chưa có học viên phù hợp. Học viên tham gia bằng mã mời
                        trong game.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          ["progress", "Tiến độ"],
          ["analytics", "Phân tích"],
          ["export", "Xuất kết quả"],
        ].map(([path, label]) => (
          <Link
            key={path}
            className="btn-secondary"
            to={`/${path}?classId=${classroom.id}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
