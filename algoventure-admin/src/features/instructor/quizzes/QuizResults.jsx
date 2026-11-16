import { useCallback } from "react";
import InstructorLink from "../workspace/InstructorLink";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiData } from "../../../shared/hooks/useApiData";
import { StudentIdentity } from "../classrooms/StudentIdentity";
import { getQuizQuestionResults, getQuizResults, studentProgressPath } from "../reports/progressService";
import { RecordStatus, ReportLoad } from "../reports/ProgressReporting";
import { reportTime } from "../reports/reportTime";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useInstructorParams } from "../workspace/useInstructorParams";

export default function QuizResults({ classId, quizId }) {
  const text = useText();
  const controls = useInstructorParams();
  const showQuestions = controls.params.get("group") === "questions";
  return <>
    <fieldset className="mb-4 flex flex-wrap items-center gap-4 text-sm">
      <legend className="sr-only">{text("Hiển thị kết quả theo")}</legend>
      {[["", "Theo sinh viên"], ["questions", "Theo câu hỏi"]].map(([value, label]) => (
        <label className="inline-flex min-h-10 items-center gap-2" key={value}>
          <input type="radio" name="quiz-results-group" className="accent-portal-purple"
            checked={showQuestions === Boolean(value)} onChange={() => controls.set("group", value)} />
          {text(label)}
        </label>
      ))}
    </fieldset>
    {showQuestions ? <QuizQuestionResults classId={classId} quizId={quizId} />
      : <QuizStudentResults classId={classId} quizId={quizId} />}
  </>;
}

function QuizStudentResults({ classId, quizId }) {
  const text = useText();
  const controls = useInstructorParams("resultsPage");
  const { page } = controls;
  const request = useApiData(useCallback(() => getQuizResults(classId, quizId, page), [classId, quizId, page]), null);
  const columns = [
    {
      key: "student", title: text("Sinh viên"), layout: "primary",
      render: ({ student }) => <StudentIdentity name={student.name} email={student.email} />,
    },
    { key: "status", title: text("Trạng thái"), render: ({ quiz }) => <RecordStatus record={quiz} quiz /> },
    { key: "submissions", title: text("Lượt đã nộp"), render: ({ quiz }) => quiz.statistics.submissions },
    { key: "latest", title: text("Điểm gần nhất"), render: ({ quiz }) => quiz.statistics.latestScore ?? "—" },
    { key: "best", title: text("Điểm cao nhất"), render: ({ quiz }) => quiz.statistics.bestScore ?? "—" },
    { key: "submittedAt", title: text("Nộp gần nhất (UTC+7)"), render: ({ quiz }) => reportTime(quiz.statistics.latestSubmittedAt) },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: ({ student, quiz }) => {
        const path = studentProgressPath(classId, student.enrollmentId);
        return <div className="table-actions">
          <InstructorLink className="btn-row-action" to={path}
            aria-label={`${text("Xem tiến độ")} · ${student.name} · ${student.email}`}>{text("Xem tiến độ")}</InstructorLink>
          {quiz.statistics.submissions > 0 && <InstructorLink className="btn-row-action" to={`${path}/quizzes/${quizId}`}
            aria-label={`${text("Xem lượt nộp")} · ${student.name} · ${student.email}`}>{text("Xem lượt nộp")}</InstructorLink>}
        </div>;
      },
    },
  ];
  return <ReportLoad request={request}>{(data) => <section className="panel overflow-hidden">
    <RecordTable label={text("Kết quả quiz theo sinh viên")} columns={columns}
      rows={data.items.map((row) => ({ ...row, id: row.student.enrollmentId }))}
      emptyMessage={text(data.total ? "Trang này không có kết quả." : "Lớp chưa có sinh viên.")} />
    <Pagination pagination={{ ...data, setPage: controls.setPage }} />
    {page > 0 && !data.items.length && <button className="btn-secondary m-4" onClick={() => controls.setPage(0)}>
      {text("Về trang đầu")}
    </button>}
  </section>}</ReportLoad>;
}

function QuizQuestionResults({ classId, quizId }) {
  const text = useText();
  const request = useApiData(useCallback(() => getQuizQuestionResults(classId, quizId), [classId, quizId]), null);
  const pagination = usePagination(request.data?.questions ?? [], quizId, useInstructorParams("questionPage"));
  const columns = [
    { key: "question", title: text("Câu hỏi"), layout: "primary", render: (question) => <strong>{question.prompt ?? question.questionId}</strong> },
    { key: "incorrect", title: text("Sai / lượt đối chiếu được"), render: (question) => question.comparable
      ? `${question.incorrect} / ${question.comparable}` : "—" },
    { key: "blank", title: text("Bỏ trống"), render: (question) => question.blank },
    { key: "unknown", title: text("Không đủ dữ liệu"), render: (question) => question.unknown },
  ];
  return <ReportLoad request={request}>{({ latestSubmissions }) => <section className="panel overflow-hidden">
    <div className="space-y-2 p-5">
      <h2 className="font-bold">{text("Câu có nhiều sinh viên trả lời sai")}</h2>
      <p className="text-sm text-portal-muted">{latestSubmissions} {text("lượt được xét, lấy lượt mới nhất của mỗi sinh viên hiện thuộc lớp. Mẫu số của từng câu gồm lượt đúng, sai hoặc xác định được là bỏ trống.")}</p>
    </div>
    {latestSubmissions > 0 ? <>
      <RecordTable label={text("Kết quả quiz theo câu hỏi")} columns={columns}
        rows={pagination.items.map((row) => ({ ...row, id: row.questionId }))}
        emptyMessage={text("Chưa có câu hỏi để đối chiếu.")} />
      <Pagination pagination={pagination} />
    </> : <p className="px-5 pb-5 text-sm text-portal-muted">{text("Chưa có lượt nộp trong lớp.")}</p>}
  </section>}</ReportLoad>;
}
