import { useText } from "../../../preferences/preferencesContext";
import { useState } from "react";
import { Download, FileDown, FileSpreadsheet, Braces } from "lucide-react";
import { PageHeader } from "../workspace/PageHeader";
import ClassroomFilter from "../classrooms/ClassroomFilter";
import { useClassroomScope } from "../classrooms/useClassroomScope";
import { downloadFile, exportStudentRows } from "./studentResultsExport";

export default function ResultsExportPage() {
  const text = useText();
  const scope = useClassroomScope();
  const [format, setFormat] = useState("CSV");
  const [message, setMessage] = useState("");

  function selectClass(classId) {
    scope.select(classId);
    setMessage("");
  }

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
    setMessage(text("Đã tải báo cáo."));
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={text("Xuất kết quả")} />
      <div className="instructor-export">
        <section className="instructor-compact-panel panel space-y-6 p-6 sm:p-8">
          <div>
            <p className="field-label">{text("Lớp học")}</p>
            <ClassroomFilter scope={{ ...scope, select: selectClass }} />
          </div>
          <fieldset>
            <legend className="field-label">{text("Định dạng tệp")}</legend>
            <div className="instructor-export-formats flex gap-4">
              {["CSV", "JSON"].map((value) => (
                <label
                  key={value}
                  className={`instructor-export-format flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-sm ${format === value ? "border-portal-purple bg-portal-lavender text-portal-ink" : "border-slate-200"}`}
                >
                  <input
                    type="radio"
                    name="format"
                    className="accent-portal-purple"
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
          {(!scope.rows.length || scope.invalid) && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{scope.invalid ? text("Lớp không khả dụng.") : text("Chưa có dữ liệu để xuất.")}</p>}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!scope.rows.length}
            onClick={handleExport}
          >
            <Download size={17} />
            {text("Tải báo cáo ")} {format}
          </button>
          {message && (
            <p role="status" className="text-sm text-portal-purple-strong">
              {message}
            </p>
          )}
        </section>
        <aside className="instructor-export-preview">
          <FileDown size={36} strokeWidth={1.5} />
          <h2>class-results.{format.toLowerCase()}</h2>
          <dl>
            <div><dt>{text(scope.classroom ? "Sinh viên" : "Lượt ghi danh theo lớp")}</dt><dd>{scope.rows.length}</dd></div>
            <div>
              <dt>{text("Lớp học")}</dt>
              {scope.classroom
                ? <dd className="wrap-anywhere text-lg!">{scope.classroom.name}</dd>
                : <dd>{scope.invalid ? 0 : scope.classes.length}</dd>}
            </div>
          </dl>
          <div className="instructor-export-columns">{["Họ tên", "Email", "Lớp học", "Điểm quiz", "Quiz đã nộp", "Mục thực hành", "Tiến độ"].map((label) => <span key={label}>{text(label)}</span>)}</div>
        </aside>
      </div>
    </div>
  );
}
