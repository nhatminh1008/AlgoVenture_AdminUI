import { formatDate } from "./dates.js";
export const STATUS_LABELS = {
  not_started: "Chưa làm",
  submitted: "Đã nộp",
  overdue: "Quá hạn",
};
export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function buildGradebookTable(rows) {
  return [
    [
      "Lớp",
      "Học viên",
      "Email",
      "Bài tập",
      "Trạng thái",
      "Điểm tốt nhất (%)",
      "Đúng/Tổng",
      "Số lượt làm",
      "Nộp lần cuối (giờ Việt Nam)",
    ],
    ...rows.map((row) => [
      row.classTitle,
      row.learnerName,
      row.learnerEmail,
      row.assignmentTitle,
      STATUS_LABELS[row.status],
      row.bestScorePercent ?? "",
      row.correctCount === null ? "" : `${row.correctCount}/${row.total}`,
      row.attemptCount,
      row.lastSubmittedAt ? formatDate(row.lastSubmittedAt) : "",
    ]),
  ];
}
export function buildQuestionErrorTable(rows) {
  return [
    [
      "Bài tập",
      "Câu hỏi",
      "Sai hoặc bỏ trống",
      "Học viên đã nộp",
      "Tỷ lệ sai (%)",
    ],
    ...rows.map((row) => [
      row.assignmentTitle,
      row.prompt,
      row.missedCount,
      row.submittedLearners,
      row.missedPercent,
    ]),
  ];
}
// Also suitable for a future XLSX adapter; no spreadsheet package is installed.
export function buildWorkbookRows(gradebook, errors) {
  return {
    gradebook: buildGradebookTable(gradebook),
    questionErrors: buildQuestionErrorTable(errors),
  };
}
export function tableToCSV(table) {
  return "\uFEFF" + table.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function downloadCSV(table, filename) {
  const url = URL.createObjectURL(
    new Blob([tableToCSV(table)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
