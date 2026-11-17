import { Link, useSearchParams } from "react-router-dom";
import { useText } from "../../../preferences/preferencesContext";
import { useClassrooms } from "../workspace/useClassrooms";
import { PageHeader } from "../workspace/PageHeader";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import ClassQuizzes from "./ClassQuizzes";

export default function InstructorQuizzesPage() {
  const text = useText();
  const { classes } = useClassrooms();
  const { childState } = useInstructorNavigation();
  const [params, setParams] = useSearchParams();
  const classId = params.get("classId");
  const classroom = classes.find((item) => item.id === classId)
    ?? classes.find((item) => !item.archivedAt)
    ?? classes[0];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={text("Trắc nghiệm")} />
      {classroom ? (
        <>
          <label className="mb-6 block max-w-sm">
            <span className="field-label">{text("Lớp học")}</span>
            <select
              className="field"
              value={classroom.id}
              onChange={(event) => setParams({ classId: event.target.value })}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.archivedAt ? text(" (Đã lưu trữ)") : ""}
                </option>
              ))}
            </select>
          </label>
          <ClassQuizzes key={classroom.id} classId={classroom.id} archivedAt={classroom.archivedAt} />
        </>
      ) : (
        <div className="panel p-10 text-center">
          <h2 className="font-semibold">{text("Chưa có lớp học")}</h2>
          <Link className="btn-primary mt-5" to="/instructor/classes/new" state={childState}>
            {text("Tạo lớp mới")}
          </Link>
        </div>
      )}
    </div>
  );
}
