import { useCallback, useEffect } from "react";
import { AlertCircle, Search } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiData } from "../../../shared/hooks/useApiData";
import { usePagination } from "../../../shared/hooks/usePagination";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";
import { useClassrooms } from "../workspace/ClassroomContext";
import InstructorBackLink from "../workspace/InstructorBackLink";
import InstructorLink from "../workspace/InstructorLink";
import { PageHeader } from "../workspace/PageHeader";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { filterStudents } from "./filterStudents";
import { DueDate, RecordStatus, ReportLoad } from "./ProgressReporting";
import { getAssignmentResults, getQuizResults, studentProgressPath } from "./progressService";
import { useReportDate, useReportTime } from "./reportTime";
import "./StudentProgress.css";

const kinds = [
  ["", "Tất cả", "All"],
  ["assignments", "Bộ thử thách", "Challenge sets"],
  ["quizzes", "Quiz", "Quizzes"],
];

export default function StudentProgressPage() {
  const text = useText();
  const scope = useClassroomScope();
  const controls = useInstructorParams();
  const { params, page, setPage, update } = controls;
  const kind = kinds.find(([value]) => value === params.get("tab"))?.[0] ?? "";
  const query = params.get("q") ?? "";
  const workId = params.get("workId") ?? "";
  const works = (kind === "assignments" ? scope.sets : scope.quizzes).filter((work) => work.status !== "Draft");
  const selected = kind && works.find((work) => work.id === workId);
  const reportDate = useReportDate();
  const options = workOptions(works, new Map(scope.classes.map((item) => [item.id, item.name])));
  const allWorkLabel = kind === "assignments"
    ? text("Tất cả bộ thử thách", "All challenge sets")
    : text("Tất cả quiz", "All quizzes");

  useEffect(() => {
    if (workId && !selected) update({ workId: "" }, ["studentPage"]);
  }, [workId, selected, update]);

  const pagination = usePagination(filterStudents(scope.rows, query), scope.selected, controls);
  const tableSearch = params.toString();
  return <div className="mx-auto max-w-6xl">
    <InstructorBackLink />
    <PageHeader title={text("Tiến độ học tập")} />
    <section className="panel overflow-hidden">
      <div className="progress-filters" role="group" aria-label={text("Lọc tiến độ", "Filter progress")}>
        <label className="progress-search">
          <span className="sr-only">{text("Tìm sinh viên")}</span>
          <Search size={18} aria-hidden="true" />
          <input type="search" className="field" value={query} placeholder={text("Tìm tên hoặc email...")}
            onChange={(event) => controls.set("q", event.target.value, true)} />
        </label>
        <ClassroomFilter scope={{ ...scope, select: (classId) => update({
          classId, workId: selected && (!classId || classId === selected.classId) ? selected.id : "",
        }, ["studentPage"]) }} />
        <div className="progress-kinds" role="group" aria-label={text("Loại bài", "Work type")}>
          {kinds.map(([value, vi, en]) => <button type="button" key={value} aria-pressed={kind === value}
            onClick={() => { if (kind !== value) update({ tab: value, workId: "" }, ["studentPage"]); }}>
            {text(vi, en)}
          </button>)}
        </div>
        {kind && <label className="progress-work">
          <span className="sr-only">{text("Chọn bài", "Select work")}</span>
          <select className="field" value={selected?.id ?? ""} onChange={(event) => controls.set("workId", event.target.value, true)}>
            <option value="">{options.length ? allWorkLabel : text("Chưa có bài được giao", "No assigned work")}</option>
            {options.map(({ work, classroom, occurrence }) => (
              <option key={work.id} value={work.id}>
                {[work.title, classroom, work.due ? reportDate(work.due) : text("Chưa đặt hạn"),
                  occurrence && text(`Lần giao ${occurrence}`, `Delivery ${occurrence}`)].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
        </label>}
      </div>
      {scope.invalid ? <p role="alert" className="p-5">{text("Không tìm thấy lớp bạn phụ trách.")}</p>
        : selected ? <WorkRows key={`${kind}/${selected.id}/${page}/${query.trim()}`}
          work={selected} kind={kind} page={page} setPage={setPage} query={query.trim()} tableSearch={tableSearch} />
          : <ProgressTable rows={pagination.items} kind={kind} pagination={pagination} tableSearch={tableSearch} />}
    </section>
  </div>;
}

function workOptions(works, classNames) {
  const groups = new Map();
  const options = works.map((work) => {
    const key = JSON.stringify([work.title, work.classId, work.due || ""]);
    const option = { work, classroom: classNames.get(work.classId) };
    const group = groups.get(key) ?? [];
    group.push(option);
    groups.set(key, group);
    return option;
  });
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // Sort by ID so the same delivery keeps its label when the class filter changes.
    group.sort((a, b) => a.work.id.localeCompare(b.work.id))
      .forEach((option, index) => { option.occurrence = index + 1; });
  }
  return options;
}

function WorkRows({ work, kind, page, setPage, query, tableSearch }) {
  const text = useText();
  const { classId, id } = work;
  const getResults = kind === "quizzes" ? getQuizResults : getAssignmentResults;
  const request = useApiData(useCallback(() => getResults(classId, id, page, query),
    [getResults, classId, id, page, query]), null);
  return <ReportLoad request={request}>{(data) => <>
    <ProgressTable rows={data.items.map(({ student, assignment, quiz }) => ({
      ...student, id: student.enrollmentId, classId, assignment, quiz,
    }))} kind={kind} workId={id} pagination={{ ...data, setPage }} tableSearch={tableSearch} />
    {page > 0 && !data.items.length && <button type="button" className="btn-secondary m-4" onClick={() => setPage(0)}>
      {text("Về trang đầu")}
    </button>}
  </>}</ReportLoad>;
}

function ProgressTable({ rows, kind, workId, pagination, tableSearch }) {
  const text = useText();
  const reportTime = useReportTime();
  const reportDate = useReportDate();
  const { classes } = useClassrooms();
  const classNames = new Map(classes.map((item) => [item.id, item.name]));
  const columns = [
    {
      key: "student", title: text("Sinh viên"), layout: "primary",
      render: (student) => {
        const params = new URLSearchParams({ progressSearch: tableSearch });
        if (kind) params.set("tab", kind);
        if (workId) params.set(kind === "quizzes" ? "quizId" : "assignmentId", workId);
        return <div>
          <InstructorLink className="progress-student-link"
            aria-label={[student.name, student.email, classNames.get(student.classId)].filter(Boolean).join(" · ")}
            to={`${studentProgressPath(student.classId, student.id)}?${params}`}>{student.name}</InstructorLink>
          <p className="instructor-student-email">{student.email}</p>
        </div>;
      },
    },
    { key: "class", title: text("Lớp học"), layout: "secondary", render: (student) => classNames.get(student.classId) },
  ];

  if (workId && kind === "assignments") columns.push(
    { key: "status", title: text("Trạng thái"), render: ({ assignment }) => <RecordStatus record={assignment} compact /> },
    { key: "items", title: text("Mục đã hoàn thành"), render: ({ assignment }) => `${assignment.completedItems} / ${assignment.assignedItems}` },
    { key: "due", title: text("Hạn (UTC+7)"), render: ({ assignment }) => <DueDate record={assignment} /> },
  );
  else if (workId && kind === "quizzes") columns.push(
    { key: "status", title: text("Trạng thái nộp", "Submission status"), render: ({ quiz }) => <RecordStatus record={quiz} quiz compact /> },
    { key: "score", title: text("Điểm cao nhất / 100", "Best score / 100"), render: ({ quiz }) => <Score value={quiz.statistics.bestScore} /> },
    { key: "due", title: text("Hạn (UTC+7)"), render: ({ quiz }) => <DueDate record={quiz} /> },
    { key: "submitted", title: text("Nộp gần nhất (UTC+7)", "Latest submission (UTC+7)"), render: ({ quiz }) => reportTime(quiz.statistics.latestSubmittedAt) },
  );
  else {
    if (kind !== "quizzes") columns.push({
      key: "practice", title: text("Mục thực hành đã xong", "Practice items completed"),
      render: (student) => <span className="tabular-nums">{student.completedLessons} / {student.assignedLessons}</span>,
    });
    if (kind !== "assignments") columns.push(
      { key: "quizzes", title: text("Quiz đã nộp"), render: (student) => student.quizzesSubmitted },
      { key: "score", title: text("Điểm quiz tổng hợp / 100", "Overall quiz score / 100"),
        hint: text("Trung bình điểm cao nhất của từng quiz đã nộp", "Average of the best score on each submitted quiz"),
        render: (student) => <Score value={student.score} /> },
    );
    if (!kind) columns.push({
      key: "due", title: text("Hạn sắp tới (UTC+7)", "Next due date (UTC+7)"),
      render: (student) => student.nextDue ? <time dateTime={student.nextDue}>{reportDate(student.nextDue)}</time> : "—",
    });
    const overdueTitles = {
      assignments: text("Bộ thử thách quá hạn", "Overdue challenge sets"),
      quizzes: text("Quiz quá hạn", "Overdue quizzes"),
    };
    columns.push({
      key: "overdue", title: overdueTitles[kind] ?? text("Bài quá hạn"),
      render: ({ overdueAssignments, overdueQuizzes }) => {
        let count = 0;
        if (kind !== "quizzes") count += overdueAssignments;
        if (kind !== "assignments") count += overdueQuizzes;
        return count > 0 ? <span className="progress-overdue"><AlertCircle size={15} aria-hidden="true" />{count}</span> : 0;
      },
    });
  }

  return <>
    <RecordTable label={text("Tiến độ sinh viên", "Student progress")} columns={columns} rows={rows}
      emptyMessage={text("Không có sinh viên phù hợp.", "No matching students.")} />
    <Pagination pagination={pagination} />
  </>;
}

function Score({ value }) {
  return <strong className="tabular-nums text-portal-ink">{value ?? "—"}</strong>;
}
