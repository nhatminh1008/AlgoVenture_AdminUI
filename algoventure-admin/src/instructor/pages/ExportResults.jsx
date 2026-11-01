import ClassNavigation from "../components/ClassNavigation";
import { useState } from "react";
import { Download } from "lucide-react";
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
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Xuất kết quả" />
      {scope.classroom && <ClassNavigation classId={scope.classroom.id} active="export" />}
      <section className="panel space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="font-bold text-slate-900">Phạm vi báo cáo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Xuất danh sách sinh viên trong các lớp bạn phụ trách. Kết quả lấy từ cùng backend với game.
          </p>
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
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-sm ${format === value ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}
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
                {value}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          <p>{scope.rows.length} bản ghi được chọn.</p>
          <p>
            {scope.rows.length
              ? "Gồm họ tên, email và lớp. Điểm là trung bình điểm cao nhất của từng quiz đã nộp."
              : scope.invalid
                ? "Lớp không thuộc danh sách bạn phụ trách."
                : "Chưa có sinh viên trong phạm vi này để xuất báo cáo."}
          </p>
        </div>
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
    </div>
  );
}
