import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, Download, Trash2, X } from "lucide-react";
import { useClassrooms } from "../data/ClassroomContext";
import {
  listMaterials,
  saveMaterial,
  deleteMaterial,
  downloadMaterial,
  validateMaterialFile,
  formatFileSize,
} from "../data/materials";

export function useMaterialList(classId) {
  const { instructor } = useClassrooms();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listMaterials(classId, instructor.id)
      .then((items) => {
        if (!cancelled) setMaterials(items);
      })
      .catch((failure) => {
        if (!cancelled) setError(failure.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, instructor.id, revision]);
  return {
    materials,
    loading,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
}

export default function ClassMaterials({ classId }) {
  const { instructor, quizzes } = useClassrooms();
  const {
    materials,
    loading,
    error: loadError,
    refresh,
  } = useMaterialList(classId);
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function selectFile(next) {
    if (busy || !next) return;
    const validation = validateMaterialFile(next);
    setError(validation);
    setMessage("");
    if (validation) {
      setFile(null);
      setTitle("");
      if (input.current) input.current.value = "";
      return;
    }
    setFile(next);
    setTitle(next.name.replace(/\.[^.]+$/, "").slice(0, 120));
  }
  async function upload(event) {
    event.preventDefault();
    setBusy("upload");
    setError("");
    setMessage("");
    try {
      await saveMaterial({
        file,
        title,
        description,
        classId,
        instructorId: instructor.id,
      });
      setFile(null);
      setTitle("");
      setDescription("");
      if (input.current) input.current.value = "";
      setMessage("Đã lưu tài liệu của lớp trên server.");
      refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  async function action(item, remove) {
    if (
      remove &&
      quizzes.some(
        (quiz) =>
          quiz.classId === classId && quiz.materialIds.includes(item.id),
      )
    ) {
      setError(
        "Tài liệu đang gắn với một bộ trắc nghiệm. Hãy gỡ liên kết ở bản nháp trước khi xóa; tài liệu của bộ đã giao được giữ lại.",
      );
      return;
    }
    if (remove && !window.confirm(`Xóa tài liệu “${item.title}” khỏi lớp?`))
      return;
    setBusy(item.id);
    setError("");
    setMessage("");
    try {
      if (remove) {
        await deleteMaterial(item.id, classId, instructor.id);
        refresh();
        setMessage("Đã xóa tài liệu.");
      } else await downloadMaterial(item.id, classId, instructor.id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form className="panel space-y-5 p-6" onSubmit={upload}>
        <div>
          <h2 className="font-bold text-slate-900">Thêm tài liệu học tập</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Đăng giáo trình, slide hoặc nội dung tham khảo cho lớp. Bạn có thể
            đính kèm tài liệu này vào bộ trắc nghiệm.
          </p>
        </div>
        <div
          className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <UploadCloud className="mx-auto mb-3 text-emerald-600" size={30} />
          <p className="text-sm font-medium text-slate-700">
            Kéo thả tài liệu vào đây
          </p>
          <p className="mb-4 mt-2 text-xs text-slate-500">
            PDF, DOCX, PPTX, TXT · Tối đa 10 MB/tệp
          </p>
          <label
            className={`btn-secondary ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            htmlFor="material-file"
          >
            Chọn tài liệu
          </label>
          <input
            ref={input}
            id="material-file"
            type="file"
            className="sr-only"
            accept=".pdf,.docx,.pptx,.txt"
            disabled={Boolean(busy)}
            onChange={(event) => selectFile(event.target.files[0])}
          />
        </div>
        {file && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
            <span className="min-w-0 break-all text-xs text-slate-600">
              {file.name} · {formatFileSize(file.size)}
            </span>
            <button
              disabled={Boolean(busy)}
              type="button"
              aria-label="Bỏ tài liệu đã chọn"
              onClick={() => {
                setFile(null);
                input.current.value = "";
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <label className="block">
          <span className="field-label">Tên tài liệu *</span>
          <input
            className="field"
            required
            maxLength={120}
            value={title}
            disabled={Boolean(busy)}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="VD: Bài giảng Bubble Sort"
          />
        </label>
        <label className="block">
          <span className="field-label">Mô tả</span>
          <textarea
            className="field"
            rows={3}
            maxLength={500}
            value={description}
            disabled={Boolean(busy)}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Gợi ý các phần sinh viên cần đọc..."
          />
        </label>
        <button
          className="btn-primary w-full"
          disabled={!file || Boolean(busy)}
        >
          <UploadCloud size={17} />
          {busy === "upload" ? "Đang lưu tài liệu…" : "Lưu tài liệu vào lớp"}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          Tệp được lưu trên server, chỉ giảng viên phụ trách được truy cập qua
          API.
        </p>
      </form>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Tài liệu của lớp</h2>
          <span className="text-xs text-slate-400">
            {materials.length} tài liệu
          </span>
        </div>
        {(error || loadError) && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error || loadError}
            {loadError && (
              <button className="ml-3 underline" onClick={refresh}>
                Thử lại
              </button>
            )}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
        {loading ? (
          <p role="status" className="panel p-8 text-sm text-slate-500">
            Đang tải tài liệu…
          </p>
        ) : (
          materials.map((item) => (
            <article key={item.id} className="panel p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-indigo-50 p-3 text-indigo-500">
                  <FileText size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold text-slate-800">
                    {item.title}
                  </h3>
                  <p className="mt-1 break-all text-xs text-slate-400">
                    {item.filename} · {formatFileSize(item.size)}
                  </p>
                  {item.description && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    Đã thêm{" "}
                    {new Date(item.uploadedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  disabled={Boolean(busy)}
                  className="btn-secondary"
                  onClick={() => action(item, false)}
                >
                  <Download size={15} />
                  Tải xuống
                </button>
                <button
                  disabled={Boolean(busy)}
                  className="btn-secondary text-red-600"
                  aria-label={`Xóa tài liệu ${item.title}`}
                  onClick={() => action(item, true)}
                >
                  <Trash2 size={15} />
                  Xóa
                </button>
              </div>
            </article>
          ))
        )}
        {!loading && !loadError && !materials.length && (
          <div className="panel p-10 text-center">
            <FileText className="mx-auto mb-3 text-slate-300" size={34} />
            <h3 className="font-semibold">Chưa có tài liệu</h3>
            <p className="mt-2 text-sm text-slate-500">
              Thêm tài liệu tham khảo đầu tiên cho lớp ở bên cạnh.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
