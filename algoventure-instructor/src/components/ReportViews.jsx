import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Link } from "react-router-dom";
import { StatusBadge } from "./ui";
import { formatDate } from "../data/dates.js";

export function TrendChart({ data }) {
  return (
    <section className="panel min-w-0 p-6">
      <h2 className="font-bold">Điểm trung bình theo ngày nộp</h2>
      <p className="mt-2 text-xs text-slate-500">
        Tất cả lượt nộp, kể cả làm lại · ngày theo giờ Việt Nam
      </p>
      {data.length ? (
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} width={35} />
              <Tooltip
                labelFormatter={(label) =>
                  `${label} · 00:00–23:59 (giờ Việt Nam)`
                }
              />
              <Line
                dataKey="average"
                name="Điểm trung bình (%)"
                stroke="#059669"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-slate-400">
          Chưa có lượt nộp để vẽ biểu đồ.
        </p>
      )}
    </section>
  );
}
export function QuestionErrorTable({ rows }) {
  return (
    <section className="panel overflow-hidden">
      <div className="p-6">
        <h2 className="font-bold">Câu hỏi thường sai</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Tính trên lượt tốt nhất của học viên đã nộp; sai và bỏ trống đều được
          tính. Học viên chưa nộp không nằm trong mẫu số.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bài tập / Câu hỏi</th>
              <th>Sai / Đã nộp</th>
              <th>Tỷ lệ sai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.assignmentId}:${row.questionId}`}>
                <td className="min-w-64">
                  <p className="mb-1 text-xs text-slate-400">
                    {row.assignmentTitle}
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {row.prompt}
                  </p>
                </td>
                <td>
                  {row.missedCount}/{row.submittedLearners}
                </td>
                <td className="font-semibold text-red-600">
                  {row.submittedLearners ? `${row.missedPercent}%` : "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">
                  Chưa có dữ liệu câu hỏi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function LearnerGradeTable({ rows, classroomId }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Bài tập</th>
            <th>Trạng thái</th>
            <th>Điểm tốt nhất</th>
            <th>Đúng / Tổng</th>
            <th>Lượt làm</th>
            <th>Nộp lần cuối (giờ Việt Nam)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.assignmentId}>
              <td>
                <Link
                  className="font-medium text-emerald-700"
                  to={`/classes/${classroomId}/assignments/${row.assignmentId}`}
                >
                  {row.assignmentTitle}
                </Link>
              </td>
              <td>
                <StatusBadge status={row.status} />
              </td>
              <td>
                {row.bestScorePercent === null
                  ? "—"
                  : `${row.bestScorePercent}%`}
              </td>
              <td>
                {row.correctCount === null
                  ? "—"
                  : `${row.correctCount}/${row.total}`}
              </td>
              <td>{row.attemptCount}</td>
              <td className="whitespace-nowrap">
                {row.lastSubmittedAt ? formatDate(row.lastSubmittedAt) : "—"}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="p-8 text-center">
                Chưa có bài tập đã giao.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function PrintTable({ table }) {
  return (
    <div className="overflow-x-auto print-table">
      <table className="data-table">
        <thead>
          <tr>
            {table[0].map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.slice(1).map((row, index) => (
            <tr key={index}>
              {row.map((cell, col) => (
                <td key={col}>{cell === "" || cell == null ? "—" : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
