import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordTable from "../../../shared/components/RecordTable";
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
  const columns = [
    { key: "name", title: text("Bài học"), layout: "primary", render: (lesson) => lesson.name },
    { key: "topic", title: text("Chủ đề"), render: (lesson) => lesson.topicId },
    {
      key: "difficulty", title: text("Độ khó"),
      render: (lesson) => lesson.hasDifficultyPresets ? lesson.difficulty : text("Theo chặng", "By stage"),
    },
    { key: "status", title: text("Trạng thái"), render: (lesson) => <RecordBadge value={lesson.status} /> },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (lesson) => (
        <Link className="btn-row-action" to={`/admin/levels?lessonId=${lesson.id}`}>
          <SlidersHorizontal aria-hidden="true" />{text("Cấu hình")}
        </Link>
      ),
    },
  ];
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
      <div className="panel overflow-hidden">
        <RecordTable label={text("Thư viện bài học")} columns={columns} rows={pagination.items}
          emptyMessage={text("Không tìm thấy bài học.")} />
        <Pagination pagination={pagination} />
      </div>
    </div>
  );
}
