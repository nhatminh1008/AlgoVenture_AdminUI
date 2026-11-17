import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import { useClassrooms } from "../workspace/useClassrooms";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";

export default function ChallengeList() {
  const text = useText();
  const location = useLocation();
  const { childState } = useInstructorNavigation();
  const { assignmentTemplates, lessonName } = useClassrooms();
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase("vi");
  const matchingTemplates = assignmentTemplates.filter((template) => template.title.toLocaleLowerCase("vi").includes(search));
  const pagination = usePagination(matchingTemplates, search);
  const columns = [
    { key: "title", title: text("Tên bộ thử thách"), layout: "primary", render: (item) => item.title },
    {
      key: "lessons", title: text("Nội dung"), layout: "wide", className: "text-sm text-portal-muted",
      render: (item) => item.algorithmIds.map(lessonName).join(", "),
    },
    {
      key: "status", title: text("Trạng thái"),
      render: (item) => item.locked ? text("Đã khóa", "Locked") : text("Bản nháp"),
    },
    {
      key: "actions", title: text("Thao tác"), layout: "actions",
      render: (item) => (
        <Link className="btn-row-action" state={childState}
          to={"/instructor/challenges?assignmentTemplateId=" + encodeURIComponent(item.id)}>
          {item.locked ? text("Xem chi tiết") : text("Chỉnh sửa")}
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={text("Bộ thử thách")}>
        <Link to="/instructor/challenges/new" state={childState} className="btn-primary">
          <Plus size={17} aria-hidden="true" />{text("Tạo bộ thử thách")}
        </Link>
      </PageHeader>
      {location.state?.message && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{location.state.message}</p>}
      <section className="panel overflow-hidden" aria-label={text("Danh sách bộ thử thách")}>
        <div className="instructor-compact-panel border-b border-portal-line p-5">
          <input className="field sm:max-w-sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Tìm bộ thử thách")} aria-label={text("Tìm bộ thử thách")} />
        </div>
        {matchingTemplates.length ? (
          <RecordTable label={text("Danh sách bộ thử thách")} columns={columns} rows={pagination.items} />
        ) : (
          <p className="p-8 text-center text-sm text-portal-muted">
            {text(search ? "Không tìm thấy bộ thử thách phù hợp" : "Chưa có bộ thử thách")}
          </p>
        )}
        <Pagination pagination={pagination} />
      </section>
    </div>
  );
}
