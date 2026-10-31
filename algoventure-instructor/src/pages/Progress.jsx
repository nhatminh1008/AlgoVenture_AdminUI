import { useState } from "react";
import { Link } from "react-router-dom";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadState,
  EmptyState,
} from "../components/ui";
import { gradebookRows, assignmentStats } from "../data/metrics.js";
import { formatDate } from "../data/dates.js";

export default function Progress() {
  const scope = useClassScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  if (scope.loading || scope.error)
    return <LoadState {...scope} retry={scope.refresh} />;
  const rows = gradebookRows(
    scope.classrooms,
    scope.members,
    scope.selectedAssignments,
    scope.history,
    scope.now,
  );
  const members = scope.members.filter(
    (member) =>
      `${member.learnerName} ${member.learnerEmail}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()) &&
      (status === "all" ||
        rows.some(
          (row) => row.learnerId === member.learnerId && row.status === status,
        )),
  );
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        breadcrumb="Giảng viên / Kết quả học tập"
        title="Tiến độ lớp học"
      />
      <ClassFilter scope={scope} assignments />
      {scope.invalid ? (
        <div className="mt-6">
          <EmptyState title="Không tìm thấy lớp hoặc bài tập được phép xem" />
        </div>
      ) : (
        <>
          <div className="my-6 grid gap-4 sm:grid-cols-3">
            <StatCard title="Học viên trong lớp" value={scope.members.length} />
            <StatCard
              title="Lượt nộp / nhiệm vụ"
              value={`${rows.filter((row) => row.status === "submitted").length}/${rows.length}`}
              note="Số cặp học viên–bài tập đã có lượt nộp"
            />
            <StatCard
              title="Chưa nộp quá hạn"
              value={rows.filter((row) => row.status === "overdue").length}
            />
          </div>
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            {scope.selectedAssignments.map((assignment) => {
              const stats = assignmentStats(
                assignment,
                scope.members,
                scope.history,
              );
              return (
                <div className="panel p-4" key={assignment.id}>
                  <p className="font-semibold">{assignment.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Hoàn thành {stats.completion}% · {stats.submitted}/
                    {stats.learners} học viên · Điểm tốt nhất TB{" "}
                    {stats.average === null ? "—" : `${stats.average}%`}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap gap-3 p-5">
              <input
                className="field sm:max-w-80"
                aria-label="Tìm học viên"
                placeholder="Tìm tên hoặc email học viên..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="field sm:max-w-56"
                aria-label="Lọc trạng thái"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="not_started">Chưa làm</option>
                <option value="submitted">Đã nộp</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>
            {scope.selectedAssignments.length && members.length ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      {scope.selectedAssignments.map((item) => (
                        <th className="min-w-64" key={item.id}>
                          <Link
                            to={`/classes/${scope.classId}/assignments/${item.id}`}
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-xs font-normal">
                            Hạn: {formatDate(item.dueAt)}
                          </p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="min-w-52 align-top">
                          <Link
                            className="font-semibold text-emerald-700"
                            to={`/classes/${scope.classId}/learners/${member.learnerId}`}
                          >
                            {member.learnerName}
                          </Link>
                          <p className="mt-1 text-xs text-slate-400">
                            {member.learnerEmail}
                          </p>
                        </td>
                        {scope.selectedAssignments.map((assignment) => {
                          const row = rows.find(
                            (item) =>
                              item.learnerId === member.learnerId &&
                              item.assignmentId === assignment.id,
                          );
                          return (
                            <td className="align-top" key={assignment.id}>
                              <StatusBadge status={row.status} />
                              <p className="mt-3 font-semibold">
                                {row.bestScorePercent === null
                                  ? "Chưa có điểm"
                                  : `${row.bestScorePercent}% · ${row.correctCount}/${row.total} đúng`}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                {row.attemptCount} lượt làm
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Lần cuối:{" "}
                                {row.lastSubmittedAt
                                  ? formatDate(row.lastSubmittedAt)
                                  : "—"}
                              </p>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                Chưa có học viên hoặc bài tập đã giao phù hợp. Bản nháp không
                xuất hiện trong tiến độ.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
