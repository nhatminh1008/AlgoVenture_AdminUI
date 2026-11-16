import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/ClassroomContext";
import { levels } from "../../../shared/curriculum/curriculumCatalog";

export default function ClassroomFormPage() {
  const text = useText();
  const { classId } = useParams();
  const { classes, saveClass } = useClassrooms();
  const existing = classes.find((item) => item.id === classId);
  const { finish } = useInstructorNavigation();
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
        <InstructorBackLink />
      </div>
    );
  if (existing?.archivedAt)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">{text("Lớp học đã lưu trữ")}</h1>
        <InstructorBackLink />
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
      finish({
        to: existing ? undefined : `/instructor/classes/${item.id}`,
        message: existing ? text("Đã cập nhật thông tin lớp.") : text("Đã tạo lớp học."),
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <InstructorBackLink />
      <PageHeader
        title={classId ? text("Chỉnh sửa lớp học") : text("Tạo lớp học mới")}
      />
      <form onSubmit={submit} className="instructor-compact-panel panel space-y-6 p-6 sm:p-8">
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
          <InstructorBackLink plain className="btn-secondary">{text("Hủy", "Cancel")}</InstructorBackLink>
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            <Check size={17} />
            {classId ? text("Lưu thay đổi") : text("Tạo lớp học")}
          </button>
        </div>
      </form>
    </div>
  );
}
