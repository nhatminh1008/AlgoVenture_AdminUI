import "./RecordTable.css";

export default function RecordTable({ label, columns, rows, emptyMessage }) {
  return (
    <div className="record-table-scroll">
      <table className="data-table record-table" role="table" aria-label={label}>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map(({ key, title, hint }) => (
              <th key={key} scope="col" role="columnheader" title={hint}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row, index) => (
            <tr key={row.id ?? index} role="row">
              {columns.map(({ key, title, layout, className, render }) => (
                <td key={key} role="cell" className={[layout && `record-table-${layout}`, className].filter(Boolean).join(" ") || undefined}>
                  {(!layout || layout === "wide") && <span className="record-table-label" aria-hidden="true">{title}</span>}
                  {render(row)}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr role="row">
              <td role="cell" colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
