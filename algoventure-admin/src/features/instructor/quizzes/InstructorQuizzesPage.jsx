import { useText } from "../../../preferences/preferencesContext";
import { useClassrooms } from "../workspace/useClassrooms";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { useInstructorParams } from "../workspace/useInstructorParams";
import ClassQuizzes from "./ClassQuizzes";

export default function InstructorQuizzesPage() {
  const text = useText();
  const { classes } = useClassrooms();
  const controls = useInstructorParams("quizPage");
  const all = controls.params.get("scope") === "all";
  const defaultClass = classes.find((item) => !item.archivedAt) ?? classes[0];
  const classId = all ? "" : controls.params.get("classId") ?? defaultClass?.id ?? "";
  const invalid = Boolean(classId && !classes.some((item) => item.id === classId));

  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink />
      <PageHeader title={text("Trắc nghiệm")} />
      {classes.length > 0 && (
        <label className="mb-6 block max-w-sm">
          <span className="field-label">{text("Lớp học")}</span>
          <select className="field" value={classId} onChange={(event) => {
            const value = event.target.value;
            controls.update({ classId: value, scope: value ? "" : "all" }, ["quizPage"]);
          }}>
            {invalid && <option value={classId} disabled>{text("Lớp không khả dụng")}</option>}
            <option value="">{text("Tất cả lớp", "All classes")}</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}{item.archivedAt ? text(" (Đã lưu trữ)") : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {invalid ? (
        <p role="alert" className="panel p-6">{text("Không tìm thấy lớp bạn phụ trách.")}</p>
      ) : classes.length ? (
        <ClassQuizzes key={classId} classId={classId} />
      ) : (
        <div className="panel p-10 text-center">
          <h2 className="font-semibold">{text("Chưa có lớp học")}</h2>
          <InstructorLink className="btn-primary mt-5" to="/instructor/classes/new">
            {text("Tạo lớp mới")}
          </InstructorLink>
        </div>
      )}
    </div>
  );
}
