import { useState } from "react";

export function usePagination(items, scope, controlled) {
  const [cursor, setCursor] = useState({ scope, page: 0 });
  const pages = Math.ceil(items.length / 10);
  const selected = controlled?.page ?? (cursor.scope === scope ? cursor.page : 0);
  const page = Math.min(selected, Math.max(0, pages - 1));
  return {
    items: items.slice(page * 10, page * 10 + 10),
    page,
    pages,
    setPage: controlled?.setPage ?? ((next) => setCursor({ scope, page: next })),
  };
}
