import React from 'react';
import { Search, Download } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/ui';
import { progressSummary, progressRows, currentClass } from '../data/mockData';

const topicColor = (v) =>
  v >= 70 ? 'bg-brand' : v >= 40 ? 'bg-orange-500' : 'bg-red-500';

const TopicCell = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="w-14 bg-slate-100 rounded-full h-1.5">
      <div className={`${topicColor(value)} h-1.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
    <span className="text-xs text-slate-500 w-6">{value}</span>
  </div>
);

const Progress = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Progress" title="Progress Tracking">
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        {progressSummary.map((s) => (
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
            <input type="text" placeholder="Search students by name, email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand" />
          </div>
          <select className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white">
            <option>Class: {currentClass}</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white">
            <option>Topic: All</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white">
            <option>Status: All</option>
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
            {progressRows.map((r, i) => (
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
          </tbody>
        </table>

        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
          <span>Showing 1-8 of 128 students</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border hover:bg-slate-50">Prev</button>
            <button className="px-3 py-1 rounded bg-brand text-white">1</button>
            <button className="px-3 py-1 rounded border hover:bg-slate-50">2</button>
            <button className="px-3 py-1 rounded border hover:bg-slate-50">3</button>
            <button className="px-3 py-1 rounded border hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
