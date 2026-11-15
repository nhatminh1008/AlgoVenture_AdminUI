import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import { useClassrooms } from "../workspace/ClassroomContext";
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

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={text("Bộ thử thách")}>
        <Link to="/instructor/challenges/new" state={childState} className="btn-primary">
          <Plus size={17} aria-hidden="true" />{text("Tạo bộ thử thách")}
        </Link>
      </PageHeader>
      {location.state?.message && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{location.state.message}</p>}
      <section className="panel overflow-hidden" aria-label={text("Danh sách bộ thử thách")}>
        <div className="border-b border-portal-line p-5">
          <input className="field sm:max-w-sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Tìm bộ thử thách")} aria-label={text("Tìm bộ thử thách")} />
        </div>
        {matchingTemplates.length ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{text("Tên bộ thử thách")}</th>
                  <th scope="col">{text("Nội dung")}</th>
                  <th scope="col">{text("Trạng thái")}</th>
                  <th scope="col"><span className="sr-only">{text("Thao tác")}</span></th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((template) => (
                  <tr key={template.id}>
                    <td className="wrap-anywhere">{template.title}</td>
                    <td className="max-w-sm text-xs text-portal-muted">{template.algorithmIds.map(lessonName).join(", ")}</td>
                    <td className="whitespace-nowrap">{template.locked ? text("Đã khóa", "Locked") : text("Bản nháp")}</td>
                    <td>
                      <Link className="btn-row-action whitespace-nowrap" state={childState}
                        to={"/instructor/challenges?assignmentTemplateId=" + encodeURIComponent(template.id)}>
                        {template.locked ? text("Xem chi tiết") : text("Chỉnh sửa")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
