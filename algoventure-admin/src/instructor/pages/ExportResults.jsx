import ClassNavigation from "../components/ClassNavigation";
import { useState } from "react";
import { Download, FileDown, FileSpreadsheet, Braces } from "lucide-react";
import { PageHeader } from "../components/ui";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import { downloadFile, exportStudentRows } from "../data/classroom";

export default function ExportResults() {
  const scope = useClassScope();
  const [format, setFormat] = useState("CSV");
  const [message, setMessage] = useState("");
  function handleExport() {
    if (!scope.rows.length) return;
    if (format === "CSV")
      downloadFile(
        exportStudentRows(scope.rows, scope.classes),
        "class-results.csv",
      );
    else
      downloadFile(
        JSON.stringify(
          {
            dataSource: "api",
            classId: scope.classroom?.id ?? null,
            students: scope.rows.map((row) => ({
              ...row,
              className: scope.classes.find((item) => item.id === row.classId)
                .name,
            })),
          },
          null,
          2,
        ),
        "class-results.json",
        "application/json",
      );
    setMessage("Đã tải báo cáo.");
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Xuất kết quả" />
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="export" />}
      <div className="instructor-export">
      <section className="panel space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="font-bold text-slate-900">Phạm vi báo cáo</h2>
        </div>
        <div>
          <p className="field-label">Lớp học</p>
          <ClassFilter scope={scope} />
        </div>
        <fieldset>
          <legend className="field-label">Định dạng tệp</legend>
          <div className="flex gap-4">
            {["CSV", "JSON"].map((value) => (
              <label
                key={value}
                className={`instructor-export-format flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-sm ${format === value ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}
              >
                <input
                  type="radio"
                  name="format"
                  className="accent-emerald-600"
                  checked={format === value}
                  onChange={() => {
                    setFormat(value);
                    setMessage("");
                  }}
                />
                {value === "CSV" ? <FileSpreadsheet size={21} /> : <Braces size={21} />}{value}
              </label>
            ))}
          </div>
        </fieldset>
        {(!scope.rows.length || scope.invalid) && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{scope.invalid ? "Lớp không khả dụng." : "Chưa có dữ liệu để xuất."}</p>}
        <button
          className="btn-primary w-full"
          disabled={!scope.rows.length}
          onClick={handleExport}
        >
          <Download size={17} />
          Tải báo cáo {format}
        </button>
        {message && (
          <p role="status" className="text-sm text-emerald-700">
            {message}
          </p>
        )}
      </section>
      <aside className="instructor-export-preview">
        <FileDown size={36} strokeWidth={1.5} />
        <h2>class-results.{format.toLowerCase()}</h2>
        <dl><div><dt>Sinh viên</dt><dd>{scope.rows.length}</dd></div><div><dt>Lớp học</dt><dd>{scope.invalid ? 0 : scope.classroom ? 1 : scope.classes.length}</dd></div></dl>
        <div className="instructor-export-columns">{["Họ tên", "Email", "Lớp học", "Điểm quiz", "Tiến độ"].map((label) => <span key={label}>{label}</span>)}</div>
      </aside>
      </div>
    </div>
  );
}
