import { Link } from "react-router-dom";

export default function ClassNavigation({ classId, active }) {
  const base = `/instructor/classes/${classId}`;
  const items = [
    ["assignments", "Bộ thử thách", `${base}?tab=assignments`],
    ["quizzes", "Trắc nghiệm", `${base}?tab=quizzes`],
    ["students", "Sinh viên", `${base}?tab=students`],
    ["progress", "Tiến độ", `/instructor/progress?classId=${classId}`],
    ["analytics", "Phân tích", `/instructor/analytics?classId=${classId}`],
    ["export", "Xuất kết quả", `/instructor/export?classId=${classId}`],
  ];
  return (
    <nav aria-label="Điều hướng lớp học" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map(([id, label, to]) => (
        <Link key={id} to={to} aria-current={active === id ? "page" : undefined}
          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${active === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
