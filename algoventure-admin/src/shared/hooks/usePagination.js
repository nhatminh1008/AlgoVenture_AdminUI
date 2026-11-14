import { useState } from "react";

export function usePagination(items, scope) {
  const [cursor, setCursor] = useState({ scope, page: 0 });
  const pages = Math.ceil(items.length / 10);
  const page = Math.min(cursor.scope === scope ? cursor.page : 0, Math.max(0, pages - 1));
  return {
    items: items.slice(page * 10, page * 10 + 10),
    page,
    pages,
    setPage: (next) => setCursor({ scope, page: next }),
  };
}
