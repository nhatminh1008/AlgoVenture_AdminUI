import { Link } from "react-router-dom";
import { useState } from "react";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordBadge from "../RecordBadge";
import { listLessons } from "./lessonService";
export default function LessonLibraryPage() {
  const state = useApiData(listLessons, []);
  const [query, setQuery] = useState("");
  const rows = state.data.filter((a) =>
    `${a.name} ${a.topicId}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title="Content & Levels" />
      <ApiFeedback state={state} />
      <input
        aria-label="Tìm bài học"
        className="field mb-5"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm bài học hoặc chủ đề…"
      />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bài học</th>
              <th>Chủ đề</th>
              <th>Độ khó</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.topicId}</td>
                <td>{a.difficulty}</td>
                <td><RecordBadge value={a.status} /></td>
                <td>
                  <Link
                    className="font-semibold text-portal-purple-strong"
                    to={`/admin/levels?lessonId=${a.id}`}
                  >
                    Cấu hình
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>Không tìm thấy bài học.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
