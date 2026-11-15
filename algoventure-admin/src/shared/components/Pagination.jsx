import { useText } from "../../preferences/preferencesContext";

export default function Pagination({ pagination }) {
  const text = useText();
  const { page, pages, setPage } = pagination;
  if (pages <= 1) return null;
  return <nav aria-label={text("Phân trang", "Pagination")} className="pagination-controls flex flex-wrap items-center justify-end gap-3 p-3 text-sm">
    <button type="button" className="btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>{text("Trước", "Previous")}</button>
    <span aria-live="polite">{text("Trang", "Page")} {page + 1}/{pages}</span>
    <button type="button" className="btn-secondary" disabled={page + 1 === pages} onClick={() => setPage(page + 1)}>{text("Sau", "Next")}</button>
  </nav>;
}
