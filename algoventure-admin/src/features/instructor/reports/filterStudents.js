export function filterStudents(rows, query) {
  const search = query.trim().toLocaleLowerCase();
  return rows.filter((row) => (
    `${row.name} ${row.email}`.toLocaleLowerCase().includes(search)
  ));
}
