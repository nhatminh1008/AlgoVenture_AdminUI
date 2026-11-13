export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function downloadFile(content, name, type = "text/csv;charset=utf-8;") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportStudentRows(rows, classes) {
  const records = rows.map((row) => [
    row.name,
    row.email,
    classes.find((c) => c.id === row.classId)?.name,
    row.score,
    row.quizzesSubmitted,
    row.completedLessons,
    row.assignedLessons,
    row.progressPercent,
  ]);
  return (
    "\uFEFF" +
    [["Họ tên", "Email", "Lớp", "Điểm quiz / 100", "Quiz đã nộp", "Bài thực hành đã xong", "Bài thực hành được giao", "Tiến độ (%)"], ...records]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
