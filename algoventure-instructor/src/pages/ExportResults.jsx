import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { progressRows, classOptions } from '../data/mockData';

const FORMATS = ['CSV', 'JSON'];
const INCLUDE_OPTS = [
  { key: 'details', label: 'Student details' },
  { key: 'mastery', label: 'Per-topic mastery' },
  { key: 'overall', label: 'Overall & status' },
];

const enrich = (r) => {
  const overall = Math.round((r.sorting + r.searching + r.ds + r.graphs) / 4);
  const status = overall >= 60 ? 'On Track' : overall >= 30 ? 'At Risk' : 'Inactive';
  return { ...r, overall, status };
};

const ExportResults = () => {
  const [format, setFormat] = useState('CSV');
  const [classFilter, setClassFilter] = useState('All');
  const [include, setInclude] = useState(['details', 'mastery', 'overall']);

  const toggleInclude = (key) =>
    setInclude((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const rows = useMemo(
    () => progressRows.map(enrich).filter((r) => classFilter === 'All' || r.className === classFilter),
    [classFilter]
  );

  const buildRecord = (r) => {
    const rec = {};
    if (include.includes('details')) {
      rec.name = r.name;
      rec.email = r.email;
      rec.class = r.className;
    }
    if (include.includes('mastery')) {
      rec.sorting = r.sorting;
      rec.searching = r.searching;
      rec.dataStructures = r.ds;
      rec.graphs = r.graphs;
    }
    if (include.includes('overall')) {
      rec.overall = r.overall;
      rec.status = r.status;
    }
    return rec;
  };

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (include.length === 0) {
      alert('Chọn ít nhất một nhóm dữ liệu để export.');
      return;
    }
    const records = rows.map(buildRecord);
    if (records.length === 0) {
      alert('Không có dữ liệu phù hợp bộ lọc.');
      return;
    }

    if (format === 'JSON') {
      download(JSON.stringify(records, null, 2), 'class_results.json', 'application/json');
    } else {
      const headers = Object.keys(records[0]);
      const csv = [
        headers.join(','),
        ...records.map((rec) => headers.map((h) => rec[h]).join(',')),
      ].join('\n');
      download(csv, 'class_results.csv', 'text/csv;charset=utf-8;');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Export" title="Export Results" />

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="font-bold text-lg text-slate-800">Export Configuration</h3>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600"
          >
            <option value="All">All classes</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Format</label>
          <div className="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  format === f ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Include</label>
          <div className="space-y-2">
            {INCLUDE_OPTS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={include.includes(opt.key)}
                  onChange={() => toggleInclude(opt.key)}
                  className="w-4 h-4 accent-[#10b981]"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
          {rows.length} bản ghi sẽ được xuất theo bộ lọc hiện tại.
        </div>

        <button
          onClick={handleExport}
          className="w-full px-4 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center justify-center gap-2"
        >
          <Download size={16} /> Generate Export
        </button>
      </div>
    </div>
  );
};

export default ExportResults;
