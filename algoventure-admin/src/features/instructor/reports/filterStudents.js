export function filterStudents(rows, query, overdue) {
  const search = query.trim().toLocaleLowerCase();
  return rows.filter((row) => (
    (!overdue || row.overdueAssignments > 0 || row.overdueQuizzes > 0)
    && `${row.name} ${row.email}`.toLocaleLowerCase().includes(search)
  ));
}
