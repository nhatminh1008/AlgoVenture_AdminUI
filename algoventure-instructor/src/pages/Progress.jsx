import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { PageHeader } from "../components/ui";
import ClassFilter, { useClassScope } from "../components/ClassFilter";
import { exportStudentRows, downloadFile } from "../data/classroom";
import { getTopic } from "../data/curriculum";

export default function Progress() {
  const scope = useClassScope();
  const [query, setQuery] = useState("");
  const rows = scope.rows.filter((row) =>
    `${row.name} ${row.email}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb="Giảng viên / Theo dõi lớp"
        title="Tiến độ học tập"
      >
        <button
          disabled={!rows.length}
          className="btn-secondary"
          onClick={() =>
            downloadFile(
              exportStudentRows(rows, scope.classes),
              "class-progress-demo.csv",
            )
          }
        >
          <Download size={16} />
          Xuất CSV
        </button>
      </PageHeader>
      <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        Đang hiển thị dữ liệu minh họa. Tiến độ hoàn thành, số lượt làm và mức
        thành thạo sẽ xuất hiện khi game gửi kết quả lên backend.
      </p>
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Tìm sinh viên</span>
            <Search
              size={17}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="field pl-10"
              placeholder="Tìm tên hoặc email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ClassFilter scope={scope} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Lớp học</th>
                <th>Chủ đề</th>
                <th>Điểm minh họa / 100</th>
                <th>Tiến độ thực tế</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const classroom = scope.classes.find(
                  (item) => item.id === row.classId,
                );
                return (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium text-slate-800">{row.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td>
                      <Link
                        className="text-emerald-700"
                        to={`/classes/${row.classId}`}
                      >
                        {classroom.name}
                      </Link>
                    </td>
                    <td>{getTopic(classroom.topicId).name}</td>
                    <td>{row.sampleScore ?? "Chưa có dữ liệu"}</td>
                    <td className="text-xs text-slate-400">Chưa đồng bộ</td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    {scope.invalid
                      ? "Không tìm thấy lớp bạn phụ trách."
                      : scope.rows.length
                        ? "Không tìm thấy sinh viên phù hợp."
                        : "Lớp chưa có sinh viên và kết quả học tập."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 p-4 text-xs text-slate-500">
          {rows.length} sinh viên trong phạm vi đã chọn
        </p>
      </div>
    </div>
  );
}
