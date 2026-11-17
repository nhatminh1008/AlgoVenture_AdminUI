import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { ClipboardCheck, Layers } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiData } from "../../../shared/hooks/useApiData";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useClassrooms } from "../workspace/ClassroomContext";
import InstructorLink from "../workspace/InstructorLink";
import { DueDate, RecordStatus, ReportLoad, StudentReportCard, StudentReportHeader } from "./ProgressReporting";
import { useReportTime } from "./reportTime";
import {
  getStudentAssignment, getStudentProgress, studentAssignmentPath, studentProgressPath,
} from "./progressService";
import { useInstructorParams } from "../workspace/useInstructorParams";

const reportFilters = new Set(["missing", "soon", "overdue"]);

function matches(record, filter) {
  if (filter === "submitted") return record.statistics?.submissions > 0;
  if (filter === "overdue") return record.timing === "OVERDUE";
  if (filter === "soon") return record.timing === "DUE_SOON";
  if (filter === "missing") return record.statistics
    ? record.applicabilityKnown && record.statistics.submissions === 0 : record.completedItems < record.assignedItems;
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
  const quizId = useInstructorParams().params.get("quizId");
  const request = useApiData(useCallback(() => getStudentProgress(path, quizId), [path, quizId]), null);
  const report = request.data;
  return <div className="progress-detail mx-auto max-w-6xl">
    <StudentReportHeader classId={classId}
      className={report?.className ?? classes.find((item) => item.id === classId)?.name}
      title={report?.student.name ?? text("Chi tiết tiến độ sinh viên")} />
    <ReportLoad request={request}>
      {(data) => <>
        <p className="-mt-3 mb-5 text-sm text-portal-muted wrap-anywhere">{data.student.email}</p>
        <StudentReport report={data} path={path} />
      </>}
    </ReportLoad>
  </div>;
}

function StudentReport({ report, path }) {
  const reportTime = useReportTime();
  const text = useText();
  const controls = useInstructorParams("assignmentPage");
  const requestedFilter = controls.params.get("filter");
  const defaultTab = requestedFilter === "overdue" && !report.overdueAssignments && report.overdueQuizzes > 0
    ? "quizzes" : "assignments";
  const requestedTab = controls.params.get("tab");
  const tab = ["assignments", "quizzes"].includes(requestedTab) ? requestedTab : defaultTab;
  const showQuiz = tab === "quizzes";
  const filter = reportFilters.has(requestedFilter) || (showQuiz && requestedFilter === "submitted") ? requestedFilter : "";
  const quizControls = useInstructorParams("quizPage");
  const assignmentId = controls.params.get("assignmentId");
  const quizId = controls.params.get("quizId");
  const filtered = (records, selectedId) => {
    const rows = records.filter((record) => matches(record, filter));
    const index = rows.findIndex((row) => row.id === selectedId);
    if (index > 0) rows.unshift(...rows.splice(index, 1));
    return rows;
  };
  const assignmentPage = usePagination(filtered(report.assignments, assignmentId), filter, controls);
  const quizPage = usePagination(filtered(report.quizzes, quizId), filter, quizControls);
  const quizColumns = [
    {
      key: "title", title: text("Quiz"), layout: "primary",
      render: (record) => record.statistics.submissions > 0 ? (
        <InstructorLink className="instructor-touch-link font-semibold underline underline-offset-2"
          to={`${path}/quizzes/${encodeURIComponent(record.id)}`}
          aria-label={`${text("Xem lượt nộp")} · ${record.title}`}>{record.title}</InstructorLink>
      ) : <strong>{record.title}</strong>,
    },
    { key: "status", title: text("Trạng thái"), render: (record) => <RecordStatus record={record} quiz compact /> },
    { key: "best", title: text("Điểm", "Score"), render: (record) => record.statistics.bestScore ?? "—" },
    { key: "due", title: text("Hạn (UTC+7)"), render: (record) => <DueDate record={record} /> },
    { key: "submitted", title: text("Nộp gần nhất (UTC+7)", "Latest submission (UTC+7)"), render: (record) => reportTime(record.statistics.latestSubmittedAt) },
  ];
  const pagination = showQuiz ? quizPage : assignmentPage;
  const overdueCount = report.overdueAssignments + report.overdueQuizzes;
  const overdueTab = (showQuiz ? report.overdueQuizzes : report.overdueAssignments) > 0 ? tab
    : report.overdueAssignments > 0 ? "assignments" : "quizzes";
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <nav className="instructor-tabs mb-0! grid-cols-2!" aria-label={text("Nội dung tiến độ", "Progress views")}>
        {[
          ["assignments", text("Bộ thử thách"), Layers],
          ["quizzes", text("Bộ quiz", "Quizzes"), ClipboardCheck],
        ].map(([id, label, Icon]) => {
          const next = new URLSearchParams(controls.params);
          next.set("tab", id);
          if (id !== "quizzes" && requestedFilter === "submitted") next.delete("filter");
          return <InstructorLink key={id} to={`?${next}`} replace aria-current={tab === id ? "page" : undefined}>
            <Icon aria-hidden="true" />{label}
          </InstructorLink>;
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <select className="field w-auto" aria-label={text("Lọc theo trạng thái")} value={filter}
          onChange={(event) => controls.set("filter", event.target.value, true, ["quizPage"])}>
          <option value="">{text("Tất cả trạng thái", "All statuses")}</option>
          {showQuiz && <option value="submitted">{text("Đã nộp")}</option>}
          <option value="missing">{text(showQuiz ? "Chưa nộp" : "Chưa hoàn thành")}</option>
          <option value="soon">{text("Sắp đến hạn")}</option>
          <option value="overdue">{text("Quá hạn")}</option>
        </select>
        {overdueCount > 0 && <button className="btn-secondary" type="button" aria-pressed={filter === "overdue"}
          onClick={() => controls.update({
            filter: filter === "overdue" ? "" : "overdue", tab: filter === "overdue" ? tab : overdueTab,
          }, ["assignmentPage", "quizPage"])}>
          {text("Bài quá hạn")} <span className="progress-overdue">{overdueCount}</span>
        </button>}
      </div>
    </div>
    <section className="panel overflow-hidden">
      {showQuiz
        ? <RecordTable label={text("Quiz của sinh viên")} columns={quizColumns} rows={pagination.items}
          currentRowId={quizId}
          emptyMessage={filter === "submitted"
            ? text("Sinh viên chưa nộp quiz nào.", "This student has not submitted any quizzes.")
            : text(filter ? "Không có quiz phù hợp." : "Chưa có quiz áp dụng hoặc lượt nộp trong lớp.")} />
        : <AssignmentPracticeTable assignments={pagination.items} assignmentItems={report.assignmentItems}
          path={path} filter={filter} assignmentId={assignmentId} />}
      <Pagination pagination={pagination} />
      {showQuiz && report.hasUnverifiedQuizHistory && <p className="border-t border-portal-line p-4 text-sm text-portal-muted">
        {text("Một số quiz đã đóng hoặc lưu trữ thiếu dữ liệu để xác định sinh viên này từng phải làm.")}
      </p>}
    </section>
  </>;
}

function AssignmentPracticeTable({ assignments, assignmentItems, path, filter, assignmentId }) {
  const text = useText();
  const reportTime = useReportTime();
  const { lessonName } = useClassrooms();
  const needsPracticeDetails = !assignmentItems && assignments.length > 0;
  const request = useApiData(useCallback(async () => {
    if (!needsPracticeDetails) return null;
    const details = await Promise.all(assignments.map(({ id }) =>
      getStudentAssignment(`${path}/assignments/${encodeURIComponent(id)}`)));
    return Object.fromEntries(details.map(({ assignment, items }) => [assignment.id, items]));
  }, [assignments, needsPracticeDetails, path]), null);

  const columns = [
    { key: "assignment", title: text("Bộ thử thách"), layout: "primary", render: ({ assignment }) => <strong>{assignment.title}</strong> },
    { key: "item", title: text("Mục thực hành"), layout: "wide",
      render: ({ item }) => item ? lessonName(item.lessonId) : text("Bộ thử thách chưa có mục thực hành.") },
    { key: "status", title: text("Trạng thái"), render: ({ item }) => item ? text(item.completedAt ? "Đã hoàn thành" : "Chưa hoàn thành") : "—" },
    { key: "score", title: text("Điểm", "Score"), render: ({ item }) => <span className="tabular-nums">{item?.score ?? "—"}</span> },
    { key: "completedAt", title: text("Hoàn thành (UTC+7)"), render: ({ item }) => reportTime(item?.completedAt) },
    { key: "due", title: text("Hạn (UTC+7)"), render: ({ assignment }) => <DueDate record={assignment} /> },
  ];

  function renderTable(itemsByAssignment) {
    const rows = assignments.flatMap((assignment) => {
      const items = itemsByAssignment[assignment.id] ?? [];
      if (!items.length) return [{ id: assignment.id, assignment }];
      return items.filter((item) => filter !== "missing" || !item.completedAt)
        .map((item) => ({ id: `${assignment.id}/${item.lessonId}`, assignment, item }));
    });
    const currentRow = rows.find(({ assignment }) => assignment.id === assignmentId);
    return <RecordTable label={text("Bộ thử thách được giao")} columns={columns} rows={rows}
      currentRowId={currentRow?.id}
      emptyMessage={text(filter ? "Không có bộ thử thách phù hợp." : "Sinh viên chưa được giao bộ thử thách.")} />;
  }

  return needsPracticeDetails
    ? <ReportLoad request={request}>{renderTable}</ReportLoad>
    : renderTable(assignmentItems ?? {});
}

export function StudentAssignmentPage() {
  const { classId, enrollmentId, assignmentId } = useParams();
  return <StudentAssignment key={`${classId}/${enrollmentId}/${assignmentId}`}
    classId={classId} enrollmentId={enrollmentId} assignmentId={assignmentId} />;
}

function StudentAssignment({ classId, enrollmentId, assignmentId }) {
  const reportTime = useReportTime();
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
