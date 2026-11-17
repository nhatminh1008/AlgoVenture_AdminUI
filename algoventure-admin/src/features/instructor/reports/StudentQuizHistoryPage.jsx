import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiData } from "../../../shared/hooks/useApiData";
import { useClassrooms } from "../workspace/useClassrooms";
import InstructorLink from "../workspace/InstructorLink";
import { progressResultsPath } from "../workspace/useInstructorNavigation";
import { DueDate, RecordStatus, ReportLoad, StudentReportCard, StudentReportHeader } from "./ProgressReporting";
import { useReportTime } from "./reportTime";
import { getQuizAttempt, getStudentQuiz, studentProgressPath } from "./progressService";
import { useInstructorParams } from "../workspace/useInstructorParams";

const answerLabels = { CORRECT: "Đúng", INCORRECT: "Sai", BLANK: "Bỏ trống", UNKNOWN: "Không đủ dữ liệu" };

export default function StudentQuizHistoryPage() {
  const { classId, enrollmentId, quizId } = useParams();
  return <StudentQuizHistory key={`${classId}/${enrollmentId}/${quizId}`}
    classId={classId} enrollmentId={enrollmentId} quizId={quizId} />;
}

function StudentQuizHistory({ classId, enrollmentId, quizId }) {
  const reportTime = useReportTime();
  const text = useText();
  const { classes } = useClassrooms();
  const studentPath = studentProgressPath(classId, enrollmentId);
  const path = `${studentPath}/quizzes/${encodeURIComponent(quizId)}`;
  const controls = useInstructorParams("attemptPage");
  const { page } = controls;
  const attemptId = controls.params.get("attemptId");
  const request = useApiData(useCallback(() => getStudentQuiz(path, page), [path, page]), null);
  const data = request.data;
  const columns = [
    { key: "submittedAt", title: text("Thời điểm nộp (UTC+7)"), layout: "primary", render: (attempt) => reportTime(attempt.submittedAt) },
    { key: "score", title: text("Điểm / 100"), render: (attempt) => attempt.score },
    { key: "actions", title: text("Thao tác"), layout: "actions", render: (attempt) => {
      const next = new URLSearchParams(controls.params);
      next.set("attemptId", attempt.id);
      next.delete("answers");
      return <InstructorLink className="btn-row-action" to={`?${next}`} replace={Boolean(attemptId)}
        aria-current={attempt.id === attemptId ? "true" : undefined}>{text("Xem câu trả lời")}</InstructorLink>;
    } },
  ];
  return <div className="mx-auto max-w-5xl">
    <StudentReportHeader classId={classId}
      className={data?.className ?? classes.find((item) => item.id === classId)?.name}
      title={data?.quiz.title ?? text("Lịch sử lượt nộp quiz")}>
      {data && <InstructorLink className="btn-secondary"
        to={progressResultsPath(classId, "quizzes", quizId)}>{text("Kết quả của lớp")}</InstructorLink>}
    </StudentReportHeader>
    <ReportLoad request={request}>{({ student, quiz, attempts }) => <>
      <StudentReportCard student={student}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <RecordStatus record={quiz} quiz />
          <div><span className="text-portal-muted">{text("Hạn (UTC+7)")}</span><div><DueDate record={quiz} /></div></div>
          <div><span className="text-portal-muted">{text("Lượt đã nộp")}</span><div><strong>{quiz.statistics.submissions}</strong></div></div>
        </div>
      </StudentReportCard>
      <section className="panel overflow-hidden">
        <h2 className="p-5 font-bold">{text("Lịch sử lượt nộp")}</h2>
        <RecordTable label={text("Lịch sử lượt nộp")} columns={columns} rows={attempts.items}
          emptyMessage={text(attempts.total ? "Trang này không có lượt nộp."
            : quiz.applicabilityKnown ? "Chưa có lượt nộp." : "Thiếu dữ liệu lịch sử về việc giao quiz cho sinh viên này.")} />
        <Pagination pagination={{ ...attempts, setPage: controls.setPage }} />
        {page > 0 && !attempts.items.length && <button className="btn-secondary m-4" onClick={() => controls.setPage(0)}>
          {text("Về trang đầu")}
        </button>}
      </section>
      {attemptId && <QuizAttemptReview key={attemptId} path={path} attemptId={attemptId} />}
    </>}</ReportLoad>
  </div>;
}

function QuizAttemptReview({ path, attemptId }) {
  const reportTime = useReportTime();
  const text = useText();
  const controls = useInstructorParams("attemptPage");
  const needsReview = controls.params.get("answers") === "review";
  const request = useApiData(useCallback(() => getQuizAttempt(path, attemptId), [path, attemptId]), null);
  return <section className="mt-5">
    <ReportLoad request={request}>{(data) => {
      const rows = data.answers.map((answer, index) => ({ ...answer, number: index + 1 }))
        .filter((answer) => !needsReview || ["INCORRECT", "BLANK"].includes(answer.outcome));
      return <div className="panel overflow-hidden">
        <div className="space-y-2 p-5">
          <h2 className="font-bold">{text("Câu trả lời của lượt nộp")}</h2>
          <p className="text-sm text-portal-muted">{reportTime(data.attempt.submittedAt)} · {text("Điểm đã lưu")} {data.attempt.score} / 100</p>
          {data.hasUnknownAnswers && <p className="text-sm text-amber-800">{text("Dữ liệu của lượt nộp này chỉ cho phép đối chiếu những câu có đủ căn cứ.")}</p>}
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" className="accent-portal-purple" checked={needsReview}
              onChange={(event) => controls.set("answers", event.target.checked ? "review" : "")} />
            {text("Chỉ câu sai hoặc bỏ trống")}
          </label>
        </div>
        <ol className="divide-y divide-portal-line border-t border-portal-line">
          {rows.map((answer) => <li key={answer.number} className="space-y-2 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold wrap-anywhere">{answer.number}. {answer.prompt ?? answer.questionId}</h3>
              <span className={`instructor-badge ${answer.outcome === "INCORRECT" ? "text-red-700" : ""}`}>{text(answerLabels[answer.outcome] ?? "Không đủ dữ liệu")}</span>
            </div>
            {answer.selectedOption != null && <p className="text-sm text-portal-muted wrap-anywhere">
              {text("Đã chọn")} · {answer.selectedOption}
            </p>}
          </li>)}
        </ol>
        {!rows.length && <p className="p-5 text-sm text-portal-muted">
          {text(needsReview ? "Không có câu sai hoặc bỏ trống xác định được." : "Không có câu trả lời để hiển thị.")}
        </p>}
      </div>;
    }}</ReportLoad>
  </section>;
}
