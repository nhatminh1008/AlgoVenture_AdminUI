import React, { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/ui';
import { progressRows, classOptions } from '../data/mockData';

const topicColor = (v) => (v >= 70 ? 'bg-brand' : v >= 40 ? 'bg-orange-500' : 'bg-red-500');

const TopicCell = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="w-14 bg-slate-100 rounded-full h-1.5">
      <div className={`${topicColor(value)} h-1.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
    <span className="text-xs text-slate-500 w-6">{value}</span>
  </div>
);

// Tính overall + status từ mastery các topic (không dùng số liệu cứng).
const enrich = (r) => {
  const overall = Math.round((r.sorting + r.searching + r.ds + r.graphs) / 4);
  const status = overall >= 60 ? 'On Track' : overall >= 30 ? 'At Risk' : 'Inactive';
  return { ...r, overall, status };
};

const STATUS_OPTS = ['All', 'On Track', 'At Risk', 'Inactive'];

const Progress = () => {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const rows = useMemo(() => progressRows.map(enrich), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQuery = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchClass = classFilter === 'All' || r.className === classFilter;
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchQuery && matchClass && matchStatus;
    });
  }, [rows, query, classFilter, statusFilter]);

  const summary = useMemo(() => {
    const count = (s) => rows.filter((r) => r.status === s).length;
    return [
      { label: 'On Track', value: count('On Track'), color: 'text-green-700', bg: 'bg-green-100' },
      { label: 'At Risk', value: count('At Risk'), color: 'text-yellow-700', bg: 'bg-yellow-100' },
      { label: 'Inactive', value: count('Inactive'), color: 'text-red-700', bg: 'bg-red-100' },
    ];
  }, [rows]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Class', 'Sorting', 'Searching', 'Data Structures', 'Graphs', 'Overall', 'Status'];
    const lines = filtered.map((r) =>
      [r.name, r.email, r.className, r.sorting, r.searching, r.ds, r.graphs, r.overall, r.status].join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Progress" title="Progress Tracking">
        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2"
        >
          <Download size={16} /> Export CSV
        </button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        {summary.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filter */}
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name, email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white"
          >
            <option value="All">Class: All</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white"
          >
            {STATUS_OPTS.map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-white">
            <tr className="text-slate-500 border-b border-slate-100">
              <th className="p-4 font-medium">Student</th>
              <th className="p-4 font-medium">Sorting</th>
              <th className="p-4 font-medium">Searching</th>
              <th className="p-4 font-medium">Data Struct.</th>
              <th className="p-4 font-medium">Graphs</th>
              <th className="p-4 font-medium">Overall</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-300"></div>
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><TopicCell value={r.sorting} /></td>
                <td className="p-4"><TopicCell value={r.searching} /></td>
                <td className="p-4"><TopicCell value={r.ds} /></td>
                <td className="p-4"><TopicCell value={r.graphs} /></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full" style={{ width: `${r.overall}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8">{r.overall}%</span>
                  </div>
                </td>
                <td className="p-4"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">Không tìm thấy học viên phù hợp bộ lọc.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 border-t border-slate-100 text-sm text-slate-500">
          Showing {filtered.length} of {rows.length} students
        </div>
      </div>
    </div>
  );
};

export default Progress;
