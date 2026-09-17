import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PageHeader, StatusBadge, DifficultyBadge } from '../components/ui';
import { algorithmsByTopic, existingChallengeSets, currentClass } from '../data/mockData';

const TABS = Object.keys(algorithmsByTopic);

const ChallengeSets = () => {
  const [activeTab, setActiveTab] = useState('Sorting');
  const [selected, setSelected] = useState(['Bubble Sort', 'Merge Sort', 'Quick Sort']);
  const [hints, setHints] = useState(true);

  const toggle = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Challenge Sets / New" title="Create Challenge Set">
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Discard</button>
        <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark">Save &amp; Assign</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Challenge Set Name</label>
            <input type="text" placeholder="e.g. Sorting Sprint Week 4"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <textarea rows={3} placeholder="Short description of this challenge set..."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assign to Class</label>
              <select className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600">
                <option>{currentClass}</option>
                <option>DSA 2026 - Group B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Difficulty</label>
              <select className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
              <input type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand text-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Time Limit (minutes)</label>
              <input type="number" defaultValue={30} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Hints Allowed</p>
              <p className="text-xs text-slate-400">Let students reveal hints during challenges</p>
            </div>
            <button onClick={() => setHints(!hints)}
              className={`w-11 h-6 rounded-full transition-colors relative ${hints ? 'bg-brand' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${hints ? 'left-5' : 'left-0.5'}`}></span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Star Thresholds (points)</label>
            <div className="grid grid-cols-3 gap-3">
              {[['1-Star', 100], ['2-Star', 200], ['3-Star', 300]].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <input type="number" defaultValue={val} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm picker */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Select Algorithms</h3>
          <div className="flex gap-6 border-b border-slate-100 mb-4">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {algorithmsByTopic[activeTab].map((algo) => (
              <label key={algo.name}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(algo.name)} onChange={() => toggle(algo.name)}
                    className="w-4 h-4 accent-[#10b981]" />
                  <span className="text-sm font-medium text-slate-700">{algo.name}</span>
                </div>
                <DifficultyBadge level={algo.difficulty} />
              </label>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Selected ({selected.length})</p>
            <div className="flex flex-wrap gap-2">
              {selected.map((name) => (
                <span key={name} className="flex items-center gap-1 bg-green-50 text-brand text-xs font-medium px-3 py-1 rounded-full">
                  {name}
                  <button onClick={() => toggle(name)}><X size={12} /></button>
                </span>
              ))}
              {selected.length === 0 && <span className="text-xs text-slate-400">No algorithms selected yet.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Existing challenge sets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-bold text-lg text-slate-800">Existing Challenge Sets</h3>
          <p className="text-sm text-slate-500">Manage assignments you have created</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 border-y border-slate-100">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Class</th>
              <th className="p-4 font-medium">Difficulty</th>
              <th className="p-4 font-medium">Due Date</th>
              <th className="p-4 font-medium">Submissions</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {existingChallengeSets.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                <td className="p-4 font-medium text-slate-700">{c.title}</td>
                <td className="p-4 text-slate-500">{c.className}</td>
                <td className="p-4"><DifficultyBadge level={c.difficulty} /></td>
                <td className="p-4 text-slate-500">{c.due}</td>
                <td className="p-4 text-slate-500">{c.submitted}/{c.total}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChallengeSets;
