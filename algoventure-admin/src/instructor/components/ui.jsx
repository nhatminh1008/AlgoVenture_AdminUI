import React from "react";

// Badge trạng thái pill — dùng chung cho nhiều màn
const STATUS_STYLES = {
  "On Track": "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  Ready: "bg-green-100 text-green-700",
  Published: "bg-green-100 text-green-700",
  "At Risk": "bg-yellow-100 text-yellow-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Inactive: "bg-red-100 text-red-700",
  Suspended: "bg-red-100 text-red-700",
  Closed: "bg-slate-100 text-slate-600",
};

export const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}
  >
    {status}
  </span>
);

const DIFFICULTY_STYLES = {
  Easy: "text-green-600",
  Medium: "text-orange-500",
  Hard: "text-red-500",
};

export const DifficultyBadge = ({ level }) => (
  <span
    className={`text-xs font-semibold ${DIFFICULTY_STYLES[level] || "text-slate-500"}`}
  >
    {level}
  </span>
);

// Thẻ thống kê trên đầu trang
export const StatCard = ({
  title,
  value,
  trend,
  isUp,
  note = "vs last month",
  icon,
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start">
      <h3 className="text-slate-500 text-sm font-medium mb-2">{title}</h3>
      {icon && <span className="text-slate-300">{icon}</span>}
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
    <div
      className={`text-xs font-medium ${isUp ? "text-brand" : "text-red-500"}`}
    >
      {trend} {note}
    </div>
  </div>
);

// Header trang: title + actions
export const PageHeader = ({ title, children }) => (
  <header className="instructor-page-header">
    <h1>{title}</h1>
    {children && <div>{children}</div>}
  </header>
);

export const MetricCard = ({ label, value, icon }) => (
  <div className="instructor-metric">
    <span className="instructor-metric-icon" aria-hidden="true">{icon}</span>
    <dl><dt>{label}</dt><dd>{value}</dd></dl>
  </div>
);

export const StudentIdentity = ({ name, email }) => (
  <div className="instructor-student">
    <span className="instructor-student-avatar" aria-hidden="true">{name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("")}</span>
    <div><p className="instructor-student-name">{name}</p>{email && <p className="instructor-student-email">{email}</p>}</div>
  </div>
);

export const ProgressMeter = ({ completed, total, percent }) => {
  if (!total) return <span className="text-xs text-slate-500">Chưa giao bài</span>;
  return <div className="instructor-progress"><div className="instructor-progress-label"><span>{completed}/{total} bài</span><strong>{percent}%</strong></div><progress max="100" value={percent} aria-label={`Hoàn thành ${completed} trên ${total} bài`} /></div>;
};
