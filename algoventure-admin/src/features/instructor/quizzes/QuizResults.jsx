import { useCallback } from "react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { usePagination } from "../../../shared/hooks/usePagination";
import { getQuizQuestionResults } from "../reports/progressService";
import { ReportLoad } from "../reports/ProgressReporting";
import { useInstructorParams } from "../workspace/useInstructorParams";

export default function QuizQuestionResults({ classId, quizId }) {
  const text = useText();
  const request = useApiDataWithErrorToast(useCallback(() => getQuizQuestionResults(classId, quizId), [classId, quizId]), null);
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
