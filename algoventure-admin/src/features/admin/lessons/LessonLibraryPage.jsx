import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordTable from "../../../shared/components/RecordTable";
import RecordBadge from "../RecordBadge";
import { listLessons } from "./lessonService";

const topics = {
  array: ["Mảng", "Array"],
  linked: ["Danh sách liên kết", "Linked List"],
  stack: ["Ngăn xếp", "Stack"],
  queue: ["Hàng đợi", "Queue"],
  tree: ["Cây", "Tree"],
  graph: ["Đồ thị", "Graph"],
};

export default function LessonLibraryPage() {
  const text = useText();
  const state = useApiDataWithErrorToast(listLessons, []);
  const { search, state: navigationState } = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 1 ? requestedPage - 1 : 0;
  const rows = state.data.filter((a) =>
    [a.name, text(a.name), a.topicId, ...(topics[a.topicId] ?? [])]
      .join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  const pagination = usePagination(rows, query, {
    page,
    setPage: (next) => {
      const updated = new URLSearchParams(params);
      if (next > 0) updated.set("page", String(next + 1));
      else updated.delete("page");
      setParams(updated, { replace: true });
    },
  });
  const columns = [
    { key: "name", title: text("Bài học"), layout: "primary", render: (lesson) => text(lesson.name) },
    { key: "topic", title: text("Chủ đề"), render: (lesson) => text(...(topics[lesson.topicId] ?? [lesson.topicId])) },
    {
      key: "timeLimit", title: text("Thời gian mặc định", "Default time"),
      render: (lesson) => `${lesson.config.timeLimit} ${text("giây", "seconds")}`,
    },
    { key: "status", title: text("Trạng thái"), render: (lesson) => <RecordBadge value={lesson.status} /> },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (lesson) => (
        <Link className="btn-row-action" to={{ pathname: `/admin/content/${encodeURIComponent(lesson.id)}/configuration`, search }}
          state={{ fromLibrary: true }}>
          <SlidersHorizontal aria-hidden="true" />{text("Cấu hình")}
        </Link>
      ),
    },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title="Content & Levels" />
      <ApiFeedback state={state} actionError={navigationState?.lessonNotFound
        ? text("Không tìm thấy bài học cần cấu hình.", "The lesson to configure was not found.") : undefined} />
      <input
        aria-label={text("Tìm bài học")}
        className="field mb-5"
        value={query}
        onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
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
