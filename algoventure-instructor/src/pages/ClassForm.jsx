import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useClassrooms } from "../data/ClassroomContext";
import {
  PageHeader,
  LoadState,
  EmptyState,
  ErrorNotice,
} from "../components/ui";

export default function ClassForm() {
  const { classId } = useParams();
  const data = useClassrooms();
  if (data.loading || data.error)
    return <LoadState {...data} retry={data.refresh} />;
  const existing = data.classrooms.find((item) => item.id === classId);
  if (classId && !existing)
    return (
      <EmptyState
        title="Không tìm thấy lớp học"
        action={
          <Link className="btn-secondary" to="/classes">
            Về lớp học
          </Link>
        }
      />
    );
  return <Editor key={classId ?? "new"} existing={existing} />;
}
function Editor({ existing }) {
  const data = useClassrooms();
  const navigate = useNavigate();
  const [form, setForm] = useState(
    () => existing ?? { title: "", description: "", topicId: "", level: "" },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  };
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const classroom = existing
        ? await data.updateClassroom(existing.id, form)
        : await data.createClassroom(form);
      navigate(`/classes/${classroom.id}`, {
        state: {
          message: existing
            ? "Đã cập nhật lớp học."
            : "Đã tạo lớp. Chia sẻ mã mời với học viên để tham gia trong game.",
        },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        breadcrumb="Lớp học / Thông tin"
        title={existing ? "Chỉnh sửa lớp học" : "Tạo lớp học"}
      />
      <form className="panel space-y-6 p-6 sm:p-8" onSubmit={save}>
        <ErrorNotice error={error} />
        <label className="block">
          <span className="field-label">Tên lớp *</span>
          <input
            autoFocus
            required
            maxLength={100}
            className="field"
            disabled={busy}
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="VD: DSA — SE19"
          />
        </label>
        <label className="block">
          <span className="field-label">Mô tả lớp</span>
          <textarea
            className="field"
            rows={4}
            maxLength={500}
            disabled={busy}
            value={form.description ?? ""}
            onChange={(event) => set("description", event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Chủ đề (tùy chọn)</span>
            <select
              className="field"
              disabled={busy}
              value={form.topicId || ""}
              onChange={(event) => set("topicId", event.target.value)}
            >
              <option value="">Không giới hạn chủ đề</option>
              {["sorting", "searching", "data-structures", "graphs"].map(
                (id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            <span className="field-label">Mức độ (tùy chọn)</span>
            <select
              className="field"
              disabled={busy}
              value={form.level || ""}
              onChange={(event) => set("level", event.target.value)}
            >
              <option value="">Không đặt mức độ</option>
              <option value="basic">Basic — Cơ bản</option>
              <option value="advanced">Advanced — Nâng cao</option>
            </select>
          </label>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Chủ đề và mức độ chỉ mô tả lớp, không giới hạn bài tập. Mã mời được
          tạo tự động và giữ nguyên khi sửa lớp.
        </p>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            className="btn-secondary"
            to={existing ? `/classes/${existing.id}` : "/classes"}
          >
            Hủy
          </Link>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Đang lưu…" : existing ? "Lưu thay đổi" : "Tạo lớp học"}
          </button>
        </div>
      </form>
    </div>
  );
}
