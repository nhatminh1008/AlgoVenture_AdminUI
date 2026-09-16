import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, Edit2 } from 'lucide-react';

const mockSortingAlgos = [
  { name: 'Bubble Sort', difficulty: 'Easy', status: 'Published', completions: '1,248' },
  { name: 'Selection Sort', difficulty: 'Easy', status: 'Published', completions: '945' },
  { name: 'Insertion Sort', difficulty: 'Easy', status: 'Published', completions: '1,032' },
  { name: 'Merge Sort', difficulty: 'Medium', status: 'Published', completions: '847' },
  { name: 'Quick Sort', difficulty: 'Medium', status: 'Draft', completions: '0' },
];

const mockSearchingAlgos = [
  { name: 'Linear Search', difficulty: 'Easy', status: 'Published', completions: '2,190' },
  { name: 'Binary Search', difficulty: 'Medium', status: 'Published', completions: '1,750' },
];

const ContentLevels = () => {
  const [openSorting, setOpenSorting] = useState(true);
  const [openSearching, setOpenSearching] = useState(true);

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    }`}>
      {status}
    </span>
  );

  const DifficultyBadge = ({ level }) => (
    <span className={`text-xs font-medium ${
      level === 'Easy' ? 'text-green-600' : 'text-orange-500'
    }`}>
      {level}
    </span>
  );

  const renderTable = (data) => (
    <table className="w-full text-left text-sm mt-4">
      <thead>
        <tr className="text-slate-500 border-b border-slate-100">
          <th className="pb-3 font-medium">Algorithm Name</th>
          <th className="pb-3 font-medium">Difficulty</th>
          <th className="pb-3 font-medium">Status</th>
          <th className="pb-3 font-medium">Completions</th>
          <th className="pb-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
            <td className="py-3 font-medium text-slate-700">{item.name}</td>
            <td className="py-3"><DifficultyBadge level={item.difficulty} /></td>
            <td className="py-3"><StatusBadge status={item.status} /></td>
            <td className="py-3 text-slate-500">{item.completions} completions</td>
            <td className="py-3 text-right">
              <div className="flex gap-2 justify-end text-slate-400">
                <button className="hover:text-brand"><Eye size={16} /></button>
                <button className="hover:text-brand"><Edit2 size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin Console / Content</p>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight w-48">Content Management</h1>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center gap-2">
          + Add New Algorithm
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6 text-sm font-medium text-slate-500">
        <button className="pb-3 border-b-2 border-brand text-brand">Algorithms</button>
        <button className="pb-3 hover:text-slate-800">Challenges</button>
        <button className="pb-3 hover:text-slate-800">Practice Sets</button>
        <button className="pb-3 hover:text-slate-800">Learning Paths</button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpenSorting(!openSorting)}>
            <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
              <span className="text-slate-400">📁</span> Sorting Algorithms
            </div>
            {openSorting ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
          </div>
          {openSorting && renderTable(mockSortingAlgos)}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpenSearching(!openSearching)}>
            <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
              <span className="text-slate-400">📁</span> Searching Algorithms
            </div>
            {openSearching ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
          </div>
          {openSearching && renderTable(mockSearchingAlgos)}
        </div>
      </div>
    </div>
  );
};

export default ContentLevels;