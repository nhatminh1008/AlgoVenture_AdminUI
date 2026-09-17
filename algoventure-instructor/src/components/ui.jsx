import React from 'react';

// Badge trạng thái pill — dùng chung cho nhiều màn
const STATUS_STYLES = {
  'On Track': 'bg-green-100 text-green-700',
  Active: 'bg-green-100 text-green-700',
  Ready: 'bg-green-100 text-green-700',
  Published: 'bg-green-100 text-green-700',
  'At Risk': 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Draft: 'bg-yellow-100 text-yellow-700',
  Processing: 'bg-yellow-100 text-yellow-700',
  Inactive: 'bg-red-100 text-red-700',
  Suspended: 'bg-red-100 text-red-700',
  Closed: 'bg-slate-100 text-slate-600',
};

export const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
    {status}
  </span>
);

const DIFFICULTY_STYLES = {
  Easy: 'text-green-600',
  Medium: 'text-orange-500',
  Hard: 'text-red-500',
};

export const DifficultyBadge = ({ level }) => (
  <span className={`text-xs font-semibold ${DIFFICULTY_STYLES[level] || 'text-slate-500'}`}>
    {level}
  </span>
);

// Thẻ thống kê trên đầu trang
export const StatCard = ({ title, value, trend, isUp, note = 'vs last month', icon }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start">
      <h3 className="text-slate-500 text-sm font-medium mb-2">{title}</h3>
      {icon && <span className="text-slate-300">{icon}</span>}
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
    <div className={`text-xs font-medium ${isUp ? 'text-brand' : 'text-red-500'}`}>
      {trend} {note}
    </div>
  </div>
);

// Thanh tiến độ nhỏ inline (dùng trong bảng)
export const InlineBar = ({ value, color = 'bg-brand' }) => (
  <div className="flex items-center gap-2">
    <div className="w-16 bg-slate-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
    <span className="text-xs text-slate-600 font-medium w-8">{value}%</span>
  </div>
);

// Header trang: breadcrumb + title + actions
export const PageHeader = ({ breadcrumb, title, children }) => (
  <div className="flex justify-between items-end mb-8">
    <div>
      <p className="text-sm text-slate-500 mb-1">{breadcrumb}</p>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
    </div>
    {children && <div className="flex gap-3">{children}</div>}
  </div>
);
