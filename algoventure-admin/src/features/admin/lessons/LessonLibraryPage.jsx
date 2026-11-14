import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordBadge from "../RecordBadge";
import { listLessons } from "./lessonService";
export default function LessonLibraryPage() {
  const text = useText();
  const state = useApiData(listLessons, []);
  const [query, setQuery] = useState("");
  const rows = state.data.filter((a) =>
    `${a.name} ${a.topicId}`.toLowerCase().includes(query.toLowerCase()),
  );
  const pagination = usePagination(rows, query);
  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title="Content & Levels" />
      <ApiFeedback state={state} />
      <input
        aria-label={text("Tìm bài học")}
        className="field mb-5"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={text("Tìm bài học hoặc chủ đề…")}
      />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{text("Bài học")}</th>
              <th>{text("Chủ đề")}</th>
              <th>{text("Độ khó")}</th>
              <th>{text("Trạng thái")}</th>
              <th>{text("Thao tác")}</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.topicId}</td>
                <td>{a.difficulty}</td>
                <td><RecordBadge value={a.status} /></td>
                <td>
                  <Link
                    className="btn-row-action"
                    to={`/admin/levels?lessonId=${a.id}`}
                  >
                    <SlidersHorizontal aria-hidden="true" />{text("Cấu hình")}
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>{text("Không tìm thấy bài học.")}</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} />
      </div>
    </div>
  );
}
