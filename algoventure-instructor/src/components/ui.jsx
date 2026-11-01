const statuses = {
  not_started: ["Chưa làm", "bg-slate-100 text-slate-600"],
  submitted: ["Đã nộp", "bg-emerald-50 text-emerald-700"],
  overdue: ["Quá hạn", "bg-red-50 text-red-700"],
  draft: ["Nháp", "bg-amber-50 text-amber-700"],
  published: ["Đã giao", "bg-emerald-50 text-emerald-700"],
};
export function StatusBadge({ status }) {
  const [label, style] = statuses[status] ?? [
    status,
    "bg-slate-100 text-slate-600",
  ];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
export function StatCard({ title, value, note, icon }) {
  return (
    <div className="panel p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm text-slate-500">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {note && <p className="mt-2 text-xs text-slate-400">{note}</p>}
    </div>
  );
}
export function PageHeader({ breadcrumb, title, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1 break-words text-sm text-slate-500">{breadcrumb}</p>
        <h1 className="break-words text-3xl font-bold text-slate-900">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}
export function LoadState({ loading, error, retry }) {
  if (!loading && !error) return null;
  return (
    <section className="panel p-8">
      <p
        role={error ? "alert" : "status"}
        className={error ? "text-sm text-red-700" : "text-sm text-slate-500"}
      >
        {error || "Đang tải dữ liệu…"}
      </p>
      {error && (
        <button className="btn-secondary mt-4" onClick={retry}>
          Thử lại
        </button>
      )}
    </section>
  );
}
export function EmptyState({ title, children, action }) {
  return (
    <section className="panel p-10 text-center">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {children}
      </div>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
export function ErrorNotice({ error }) {
  return error ? (
    <p
      role="alert"
      className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
    >
      {error}
    </p>
  ) : null;
}
