import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import { useClassrooms } from "../workspace/useClassrooms";
import InstructorLink from "../workspace/InstructorLink";

export default function ChallengeList() {
  const text = useText();
  const { assignmentTemplates, lessonName, removeAssignmentTemplate } = useClassrooms();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const controls = useInstructorParams("page");
  const query = controls.params.get("q") ?? "";
  const search = query.trim().toLocaleLowerCase("vi");
  const matchingTemplates = assignmentTemplates.filter((template) => template.title.toLocaleLowerCase("vi").includes(search));
  const pagination = usePagination(matchingTemplates, search, controls);

  async function remove(item) {
    if (deletingId || !window.confirm(text(`Xóa bản nháp “${item.title}”?`, `Delete draft “${item.title}”?`))) return;
    setDeletingId(item.id);
    setError("");
    try {
      await removeAssignmentTemplate(item.id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setDeletingId(null);
    }
  }

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
        <div className="table-actions">
          <InstructorLink className="btn-row-action"
            to={"/instructor/challenges?assignmentTemplateId=" + encodeURIComponent(item.id)}>
            {item.locked ? text("Xem chi tiết") : text("Chỉnh sửa")}
          </InstructorLink>
          {!item.locked && (
            <button type="button" className="btn-row-action btn-row-action-danger"
              aria-label={`${text("Xóa bản nháp", "Delete draft")} · ${item.title}`}
              disabled={deletingId !== null} onClick={() => remove(item)}>
              <Trash2 aria-hidden="true" />
              {deletingId === item.id ? text("Đang xóa…", "Deleting…") : text("Xóa bản nháp", "Delete draft")}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <InstructorBackLink />
      <PageHeader title={text("Bộ thử thách")}>
        <InstructorLink to="/instructor/challenges/new" className="btn-primary">
          <Plus size={17} aria-hidden="true" />{text("Tạo bộ thử thách")}
        </InstructorLink>
      </PageHeader>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{text(error)}</p>}
      <section className="panel overflow-hidden" aria-label={text("Danh sách bộ thử thách")}>
        <div className="instructor-compact-panel border-b border-portal-line p-5">
          <input className="field sm:max-w-sm" type="search" value={query} onChange={(event) => controls.set("q", event.target.value, true)}
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
