import { useState } from "react";
import { Download, Printer } from "lucide-react";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import { PageHeader, LoadState, EmptyState } from "../components/ui";
import { PrintTable } from "../components/ReportViews";
import { gradebookRows, questionErrorStats } from "../data/metrics.js";
import { buildWorkbookRows, downloadCSV } from "../data/exports.js";
import { formatDate } from "../data/dates.js";

export default function ExportResults() {
  const scope = useClassScope();
  const [kind, setKind] = useState("gradebook");
  const [message, setMessage] = useState("");
  if (scope.loading || scope.error)
    return <LoadState {...scope} retry={scope.refresh} />;
  const gradebook = gradebookRows(
    scope.classrooms,
    scope.members,
    scope.selectedAssignments,
    scope.history,
    scope.now,
  );
  const errors = scope.selectedAssignments.flatMap((assignment) =>
    questionErrorStats(assignment, scope.history, scope.members),
  );
  const tables = buildWorkbookRows(gradebook, errors);
  const table = kind === "gradebook" ? tables.gradebook : tables.questionErrors;
  const title =
    kind === "gradebook" ? "Bảng điểm lớp học" : "Báo cáo lỗi theo câu hỏi";
  return (
    <div className="mx-auto max-w-7xl">
      <div className="no-print">
        <PageHeader breadcrumb="Giảng viên / Báo cáo" title="Xuất kết quả" />
        <ClassFilter scope={scope} assignments />
        {scope.invalid && (
          <div className="mt-6">
            <EmptyState title="Không tìm thấy lớp hoặc bài tập được phép xem" />
          </div>
        )}
        <section className="panel my-6 flex flex-wrap items-end gap-4 p-5">
          <label className="min-w-56 flex-1">
            <span className="field-label">Loại báo cáo</span>
            <select
              className="field"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setMessage("");
              }}
            >
              <option value="gradebook">Bảng điểm học viên</option>
              <option value="questionErrors">Lỗi theo câu hỏi</option>
            </select>
          </label>
          <button
            className="btn-primary"
            disabled={scope.invalid || table.length < 2}
            onClick={() => {
              downloadCSV(
                table,
                kind === "gradebook"
                  ? "classroom-gradebook.csv"
                  : "classroom-question-errors.csv",
              );
              setMessage("Đã tải báo cáo CSV theo bộ lọc hiện tại.");
            }}
          >
            <Download size={16} />
            Tải CSV
          </button>
          <button
            className="btn-secondary"
            disabled={scope.invalid || table.length < 2}
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Lưu thành PDF
          </button>
          <p className="w-full text-xs leading-5 text-slate-500">
            PDF dùng hộp thoại in của trình duyệt: chọn “Lưu dưới dạng PDF”.
            Xuất XLSX chưa hỗ trợ; bạn có thể mở CSV bằng Excel.
          </p>
          {message && (
            <p role="status" className="w-full text-sm text-emerald-700">
              {message}
            </p>
          )}
        </section>
      </div>
      <section className="report panel overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {scope.classroom?.title || "Chưa chọn lớp"} ·{" "}
            {scope.assignmentId
              ? scope.selectedAssignments[0]?.title
              : "Tất cả bài tập đã giao"}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Xuất lúc {formatDate(scope.now().toISOString())} · Asia/Ho_Chi_Minh
          </p>
          {kind !== "gradebook" && (
            <p className="mt-2 text-xs text-slate-500">
              Sai/bỏ trống trong lượt tốt nhất; mẫu số là học viên đã nộp.
            </p>
          )}
        </div>
        {!scope.invalid && table.length > 1 ? (
          <PrintTable table={table} />
        ) : (
          <p className="p-8 text-center text-sm text-slate-500">
            Chưa có dữ liệu để xuất theo bộ lọc này.
          </p>
        )}
      </section>
    </div>
  );
}
