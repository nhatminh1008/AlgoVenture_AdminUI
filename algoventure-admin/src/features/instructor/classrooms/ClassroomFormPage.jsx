import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import { useClassrooms } from "../workspace/ClassroomContext";
import { levels } from "../../../shared/curriculum/curriculumCatalog";

export default function ClassroomFormPage() {
  const text = useText();
  const { classId } = useParams();
  const { classes, saveClass } = useClassrooms();
  const existing = classes.find((item) => item.id === classId);
  const navigate = useNavigate();
  const [values, setValues] = useState(
    () =>
      existing ?? { name: "", description: "", level: "basic" },
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (classId && !existing)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">{text("Không tìm thấy lớp học")}</h1>
        <Link className="btn-secondary mt-4" to="/instructor/classes">
          {text("Về lớp của tôi")}
        </Link>
      </div>
    );
  if (existing?.archivedAt)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">{text("Lớp học đã lưu trữ")}</h1>
        <Link className="btn-secondary mt-4" to={`/instructor/classes/${classId}`}>
          {text("Xem lớp học")}
        </Link>
      </div>
    );
  function field(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setError("");
  }
  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { name, description, level } = values;
      const item = await saveClass({ name, description, level }, classId);
      navigate(`/instructor/classes/${item.id}`, {
        state: {
          message: classId
            ? text("Đã cập nhật thông tin lớp.")
            : text("Đã tạo lớp học."),
        },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-portal-purple-strong"
        to={existing ? `/instructor/classes/${classId}` : "/instructor/classes"}
      >
        <ArrowLeft size={16} />
        {text("Quay lại")}
      </Link>
      <PageHeader
        title={classId ? text("Chỉnh sửa lớp học") : text("Tạo lớp học mới")}
      />
      <form onSubmit={submit} className="panel space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {text("Thông tin lớp học")}
          </h2>
        </div>
        <div>
          <label className="field-label" htmlFor="class-name">
            {text("Tên lớp ")} <span className="text-red-500">*</span>
          </label>
          <input
            id="class-name"
            className="field"
            autoFocus
            required
            maxLength={100}
            value={values.name}
            onChange={(e) => field("name", e.target.value)}
            placeholder={text("VD: Sorting cơ bản — SE19")}
          />
        </div>
        <fieldset>
          <legend className="field-label">
            {text("Mức độ lớp học ")} <span className="text-red-500">*</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {levels.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-xl border p-4 ${values.level === item.id ? "border-portal-purple bg-portal-lavender/70" : "border-slate-200"}`}
              >
                <span className="mb-2 flex items-center gap-2">
                  <input
                    type="radio"
                    name="level"
                    value={item.id}
                    checked={values.level === item.id}
                    onChange={() => field("level", item.id)}
                    className="accent-portal-purple"
                  />
                  <strong className="text-sm text-slate-800">
                    {item.label}
                  </strong>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="field-label" htmlFor="class-description">
            {text("Mô tả và mục tiêu học tập")}
          </label>
          <textarea
            id="class-description"
            className="field"
            rows={4}
            maxLength={500}
            value={values.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder={text("Sinh viên sẽ luyện tập những kiến thức và kỹ năng nào?")}
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {values.description.length}/500
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            className="btn-secondary"
            to={
              existing
                ? `/instructor/classes/${classId}`
                : "/instructor/classes"
            }
          >
            {text("Hủy")}
          </Link>
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            <Check size={17} />
            {classId ? text("Lưu thay đổi") : text("Tạo lớp học")}
          </button>
        </div>
      </form>
    </div>
  );
}
