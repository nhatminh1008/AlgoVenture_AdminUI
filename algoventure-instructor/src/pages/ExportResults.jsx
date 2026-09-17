import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/ui';
import { recentExports, currentClass } from '../data/mockData';

const FORMATS = ['CSV', 'XLSX', 'PDF'];
const INCLUDE_OPTS = ['Student details', 'Per-topic mastery', 'Attempt history', 'Time spent'];

const ExportResults = () => {
  const [format, setFormat] = useState('CSV');
  const [include, setInclude] = useState(['Student details', 'Per-topic mastery']);

  const toggleInclude = (opt) =>
    setInclude((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Export" title="Export Results" />

      <div className="grid grid-cols-2 gap-6">
        {/* Config */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-slate-800">Export Configuration</h3>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data Type</label>
            <select className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600">
              <option>Student Progress</option>
              <option>Challenge Submissions</option>
              <option>Mastery Report</option>
              <option>Full Class Log</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
            <select className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600">
              <option>{currentClass}</option>
              <option>DSA 2026 - Group B</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
              <input type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand text-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
              <input type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    format === f ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Include</label>
            <div className="space-y-2">
              {INCLUDE_OPTS.map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={include.includes(opt)} onChange={() => toggleInclude(opt)}
                    className="w-4 h-4 accent-[#10b981]" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="w-full px-4 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center justify-center gap-2">
            <Download size={16} /> Generate Export
          </button>
        </div>

        {/* Recent exports */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-bold text-lg text-slate-800">Recent Exports</h3>
            <p className="text-sm text-slate-500">Download your previously generated files</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 border-y border-slate-100">
                <th className="p-4 font-medium">File Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Size</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <FileText size={16} className="text-slate-400" />
                      {e.file}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{e.type}</td>
                  <td className="p-4 text-slate-500">{e.date}</td>
                  <td className="p-4 text-slate-500">{e.size}</td>
                  <td className="p-4"><StatusBadge status={e.status} /></td>
                  <td className="p-4">
                    <button
                      disabled={e.status !== 'Ready'}
                      className={`${e.status === 'Ready' ? 'text-brand hover:text-brand-dark' : 'text-slate-300 cursor-not-allowed'}`}>
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportResults;
