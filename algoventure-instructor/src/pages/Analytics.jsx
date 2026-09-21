import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui';
import { engagementByMonth, progressRows } from '../data/mockData';

// Các khoảng thời gian lọc thật trên dữ liệu theo tháng.
const RANGES = [
  { key: '3m', label: 'Last 3 months', months: 3 },
  { key: '6m', label: 'Last 6 months', months: 6 },
  { key: 'ytd', label: 'This year', months: 12 },
];

const Analytics = () => {
  const [rangeKey, setRangeKey] = useState('6m');

  const range = RANGES.find((r) => r.key === rangeKey);

  const data = useMemo(
    () => engagementByMonth.slice(-range.months),
    [range]
  );

  // Stat cards tính từ khoảng đang chọn + dữ liệu học viên thật.
  const stats = useMemo(() => {
    const last = data[data.length - 1] || {};
    const first = data[0] || {};
    const delta = (a, b) => (b ? +(((a - b) / b) * 100).toFixed(1) : 0);

    const avgMasteryStudents = Math.round(
      progressRows.reduce((sum, r) => sum + (r.sorting + r.searching + r.ds + r.graphs) / 4, 0) /
        progressRows.length
    );

    return [
      { title: 'Avg. Mastery', value: `${avgMasteryStudents}%`, trend: `${delta(last.avgMastery, first.avgMastery)}%`, isUp: last.avgMastery >= first.avgMastery, note: 'in range' },
      { title: 'Completion Rate', value: `${last.completion ?? 0}%`, trend: `${delta(last.completion, first.completion)}%`, isUp: last.completion >= first.completion, note: 'in range' },
      { title: 'Active Learners', value: `${last.dau ?? 0}`, trend: `${delta(last.dau, first.dau)}%`, isUp: last.dau >= first.dau, note: 'in range' },
      { title: 'Students', value: `${progressRows.length}`, trend: '0%', isUp: true, note: 'total' },
    ];
  }, [data]);

  // Độ khó thuật toán tính bằng số học viên có mastery topic < 50 (đại diện "struggle").
  const difficulty = useMemo(() => {
    const topics = [
      { name: 'Sorting', key: 'sorting' },
      { name: 'Searching', key: 'searching' },
      { name: 'Data Struct.', key: 'ds' },
      { name: 'Graphs', key: 'graphs' },
    ];
    return topics.map((t) => ({
      name: t.name,
      struggling: progressRows.filter((r) => r[t.key] < 50).length,
      avg: Math.round(progressRows.reduce((s, r) => s + r[t.key], 0) / progressRows.length),
    }));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Analytics" title="Class Analytics">
        <select
          value={rangeKey}
          onChange={(e) => setRangeKey(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white"
        >
          {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download size={16} /> Download Report
        </button>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      {/* Engagement */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Class Engagement</h3>
            <p className="text-sm text-slate-500">Active learners per month · {range.label.toLowerCase()}</p>
          </div>
          <span className="text-xs font-medium text-brand bg-green-50 px-3 py-1 rounded-full h-fit flex items-center gap-1">
            ● Active Users
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip />
              <Area type="monotone" dataKey="dau" stroke="#10b981" strokeWidth={3} fill="url(#colorDau)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic mastery */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800">Average Mastery by Topic</h3>
        <p className="text-sm text-slate-500 mb-4">Tính từ điểm mastery hiện tại của lớp</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficulty} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip />
              <Bar dataKey="avg" name="Avg mastery" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
