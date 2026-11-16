import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { ClipboardCheck, Layers, Timer } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiData } from "../../../shared/hooks/useApiData";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useClassrooms } from "../workspace/ClassroomContext";
import InstructorLink from "../workspace/InstructorLink";
import { DueDate, RecordStatus, ReportLoad, StudentReportCard, StudentReportHeader } from "./ProgressReporting";
import { reportTime } from "./reportTime";
import {
  getStudentAssignment, getStudentProgress, studentAssignmentPath, studentProgressPath,
} from "./progressService";
import { useInstructorParams } from "../workspace/useInstructorParams";

const reportFilters = new Set(["missing", "soon", "overdue"]);

function matches(record, filter) {
  if (filter === "overdue") return record.timing === "OVERDUE";
  if (filter === "soon") return record.timing === "DUE_SOON";
  if (filter === "missing") return record.statistics
    ? record.statistics.submissions === 0 : record.completedItems < record.assignedItems;
  return true;
}

export default function StudentProgressDetailPage() {
  const { classId, enrollmentId } = useParams();
  return <StudentProgressDetail key={`${classId}/${enrollmentId}`} classId={classId} enrollmentId={enrollmentId} />;
}

function StudentProgressDetail({ classId, enrollmentId }) {
  const text = useText();
  const { classes } = useClassrooms();
  const path = studentProgressPath(classId, enrollmentId);
  const request = useApiData(useCallback(() => getStudentProgress(path), [path]), null);
  const report = request.data;
  return <div className="mx-auto max-w-6xl">
    <StudentReportHeader classId={classId}
      className={report?.className ?? classes.find((item) => item.id === classId)?.name}
      title={text("Chi tiết tiến độ sinh viên")} />
    <ReportLoad request={request}>
      {(data) => <StudentReport report={data} path={path} />}
    </ReportLoad>
  </div>;
}

function StudentReport({ report, path }) {
  const text = useText();
  const controls = useInstructorParams("assignmentPage");
  const requestedFilter = controls.params.get("filter");
  const filter = reportFilters.has(requestedFilter) ? requestedFilter : "";
  const defaultTab = filter === "overdue" && !report.overdueAssignments && report.overdueQuizzes > 0
    ? "quizzes" : "assignments";
  const requestedTab = controls.params.get("tab");
  const tab = ["assignments", "quizzes"].includes(requestedTab) ? requestedTab : defaultTab;
  const showQuiz = tab === "quizzes";
  const quizControls = useInstructorParams("quizPage");
  const assignmentPage = usePagination(report.assignments.filter((record) => matches(record, filter)), filter, controls);
  const quizPage = usePagination(report.quizzes.filter((record) => matches(record, filter)), filter, quizControls);
  const baseColumns = (quiz) => [
    { key: "title", title: text(quiz ? "Quiz" : "Bộ thử thách"), layout: "primary", render: (record) => <strong>{record.title}</strong> },
    { key: "due", title: text("Hạn (UTC+7)"), render: (record) => <DueDate record={record} /> },
    { key: "status", title: text("Trạng thái"), render: (record) => <RecordStatus record={record} quiz={quiz} /> },
  ];
  const details = (quiz) => {
    const label = quiz ? text("Xem kết quả bài nộp", "View submission results") : text("Xem mục thực hành", "View practice items");
    return {
      key: "open", title: text("Thao tác"), layout: "actions",
      render: (record) => <InstructorLink className="btn-row-action"
        to={`${path}/${quiz ? "quizzes" : "assignments"}/${encodeURIComponent(record.id)}`}
        aria-label={`${label} · ${record.title}`}>{label}</InstructorLink>,
    };
  };
  const assignmentColumns = [
    ...baseColumns(false),
    { key: "items", title: text("Mục đã hoàn thành"), render: (record) => `${record.completedItems} / ${record.assignedItems}` },
    details(false),
  ];
  const quizColumns = [
    ...baseColumns(true),
    { key: "best", title: text("Điểm cao nhất / 100", "Best score / 100"), render: (record) => record.statistics.bestScore ?? "—" },
    { key: "submitted", title: text("Nộp gần nhất (UTC+7)", "Latest submission (UTC+7)"), render: (record) => reportTime(record.statistics.latestSubmittedAt) },
    details(true),
  ];
  const pagination = showQuiz ? quizPage : assignmentPage;
  return <>
    <StudentReportCard student={report.student}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {[
          [text("Quiz đã nộp"), report.quizzesSubmitted, ClipboardCheck],
          [text("Mục thực hành đã hoàn thành / được giao"), `${report.completedItems} / ${report.assignedItems}`, Layers],
          [text("Bài quá hạn"), report.overdueAssignments + report.overdueQuizzes, Timer],
        ].map(([label, value, Icon]) => <div key={label}>
          <dt className="flex items-start gap-2 text-xs text-portal-muted"><Icon size={15} className="shrink-0" aria-hidden="true" />{label}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{Icon === Timer && value > 0 ? (
            <InstructorLink to={`?${new URLSearchParams({ filter: "overdue", tab: report.overdueAssignments ? "assignments" : "quizzes" })}`}
              replace className="text-portal-purple-strong hover:underline" aria-label={`${value} ${text("bài quá hạn")}`}>
              {value}
            </InstructorLink>
          ) : value}</dd>
        </div>)}
      </dl>
    </StudentReportCard>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <nav className="instructor-tabs mb-0! grid-cols-2!" aria-label={text("Nội dung tiến độ", "Progress views")}>
        {[
          ["assignments", text("Bộ thử thách"), Layers],
          ["quizzes", text("Bộ quiz", "Quizzes"), ClipboardCheck],
        ].map(([id, label, Icon]) => {
          const next = new URLSearchParams(controls.params);
          next.set("tab", id);
          return <InstructorLink key={id} to={`?${next}`} replace aria-current={tab === id ? "page" : undefined}>
            <Icon aria-hidden="true" />{label}
          </InstructorLink>;
        })}
      </nav>
      <select className="field w-auto" aria-label={text("Lọc theo trạng thái", "Filter by status")} value={filter}
        onChange={(event) => controls.set("filter", event.target.value, true, ["quizPage"])}>
        <option value="">{text("Tất cả trạng thái", "All statuses")}</option>
        <option value="missing">{text("Chưa hoàn thành")}</option>
        <option value="soon">{text("Sắp đến hạn")}</option>
        <option value="overdue">{text("Quá hạn")}</option>
      </select>
    </div>
    <section className="panel overflow-hidden">
      {showQuiz
        ? <RecordTable label={text("Quiz của sinh viên")} columns={quizColumns} rows={pagination.items}
          emptyMessage={text(filter ? "Không có quiz phù hợp." : "Chưa có quiz áp dụng hoặc lượt nộp trong lớp.")} />
        : <RecordTable label={text("Bộ thử thách được giao")} columns={assignmentColumns} rows={pagination.items}
          emptyMessage={text(filter ? "Không có bộ thử thách phù hợp." : "Sinh viên chưa được giao bộ thử thách.")} />}
      <Pagination pagination={pagination} />
      {showQuiz && report.hasUnverifiedQuizHistory && <p className="border-t border-portal-line p-4 text-sm text-portal-muted">
        {text("Một số quiz đã đóng hoặc lưu trữ thiếu dữ liệu để xác định sinh viên này từng phải làm.")}
      </p>}
    </section>
  </>;
}

export function StudentAssignmentPage() {
  const { classId, enrollmentId, assignmentId } = useParams();
  return <StudentAssignment key={`${classId}/${enrollmentId}/${assignmentId}`}
    classId={classId} enrollmentId={enrollmentId} assignmentId={assignmentId} />;
}

function StudentAssignment({ classId, enrollmentId, assignmentId }) {
  const text = useText();
  const { classes, lessonName } = useClassrooms();
  const assignmentPath = studentAssignmentPath(classId, enrollmentId, assignmentId);
  const request = useApiData(useCallback(() => getStudentAssignment(assignmentPath), [assignmentPath]), null);
  const data = request.data;
  const columns = [
    { key: "item", title: text("Mục thực hành"), layout: "primary", render: (item) => <strong>{lessonName(item.lessonId)}</strong> },
    { key: "status", title: text("Trạng thái"), render: (item) => text(item.completedAt ? "Đã hoàn thành" : "Chưa hoàn thành") },
    { key: "time", title: text("Hoàn thành (UTC+7)"), render: (item) => reportTime(item.completedAt) },
  ];
  return <div className="mx-auto max-w-5xl">
    <StudentReportHeader classId={classId}
      className={data?.className ?? classes.find((item) => item.id === classId)?.name}
      title={data?.assignment.title ?? text("Bộ thử thách")} />
    <ReportLoad request={request}>{({ student, assignment, items }) => {
      const rows = items.map((item) => ({ ...item, id: item.lessonId }));
      return <>
        <StudentReportCard student={student}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div><span className="text-portal-muted">{text("Hạn (UTC+7)")}</span><div><DueDate record={assignment} /></div></div>
            <RecordStatus record={assignment} />
            <strong>{assignment.completedItems} / {assignment.assignedItems} {text("mục hoàn thành")}</strong>
          </div>
        </StudentReportCard>
        <div className="panel overflow-hidden"><RecordTable label={text("Mục thực hành")} columns={columns} rows={rows}
          emptyMessage={text("Bộ thử thách chưa có mục thực hành.")} /></div>
      </>;
    }}</ReportLoad>
  </div>;
}
