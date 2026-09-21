import React, { useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge, DifficultyBadge } from '../components/ui';
import { algorithmsByTopic, existingChallengeSets, classOptions, currentClass } from '../data/mockData';

const TABS = Object.keys(algorithmsByTopic);

const emptyForm = {
  title: '',
  description: '',
  className: currentClass,
  difficulty: 'Easy',
  due: '',
  timeLimit: 30,
  hints: true,
  algorithms: [],
  status: 'Draft',
};

const ChallengeSets = () => {
  const [sets, setSets] = useState(existingChallengeSets);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = tạo mới
  const [activeTab, setActiveTab] = useState('Sorting');

  const isEditing = editingId !== null;

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAlgorithm = (name) =>
    setForm((prev) => ({
      ...prev,
      algorithms: prev.algorithms.includes(name)
        ? prev.algorithms.filter((n) => n !== name)
        : [...prev.algorithms, name],
    }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Vui lòng nhập tên Challenge Set.');
      return;
    }
    if (isEditing) {
      setSets((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...form } : s)));
    } else {
      const nextId = sets.length ? Math.max(...sets.map((s) => s.id)) + 1 : 1;
      setSets((prev) => [...prev, { id: nextId, ...form }]);
    }
    resetForm();
  };

  const handleEdit = (set) => {
    setForm({
      title: set.title || '',
      description: set.description || '',
      className: set.className || currentClass,
      difficulty: set.difficulty || 'Easy',
      due: set.due || '',
      timeLimit: set.timeLimit ?? 30,
      hints: set.hints ?? true,
      algorithms: set.algorithms || [],
      status: set.status || 'Draft',
    });
    setEditingId(set.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (set) => {
    if (!window.confirm(`Xóa challenge set "${set.title}"?`)) return;
    setSets((prev) => prev.filter((s) => s.id !== set.id));
    if (editingId === set.id) resetForm();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        breadcrumb={`Instructor / Challenge Sets / ${isEditing ? 'Edit' : 'New'}`}
        title={isEditing ? 'Edit Challenge Set' : 'Create Challenge Set'}
      >
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
        >
          {isEditing ? 'Cancel' : 'Discard'}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark"
        >
          {isEditing ? 'Update' : 'Save & Assign'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Challenge Set Name</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Sorting Sprint Week 4"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Short description of this challenge set..."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assign to Class</label>
              <select
                value={form.className}
                onChange={(e) => setField('className', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600"
              >
                {classOptions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setField('difficulty', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => setField('due', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                value={form.timeLimit}
                onChange={(e) => setField('timeLimit', Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Hints Allowed</p>
              <p className="text-xs text-slate-400">Let students reveal hints during challenges</p>
            </div>
            <button
              onClick={() => setField('hints', !form.hints)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.hints ? 'bg-brand' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.hints ? 'left-5' : 'left-0.5'}`}></span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-white text-slate-600"
            >
              <option>Draft</option>
              <option>Active</option>
              <option>Closed</option>
            </select>
          </div>
        </div>

        {/* Algorithm picker */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Select Algorithms</h3>
          <div className="flex gap-6 border-b border-slate-100 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {algorithmsByTopic[activeTab].map((algo) => (
              <label
                key={algo.name}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.algorithms.includes(algo.name)}
                    onChange={() => toggleAlgorithm(algo.name)}
                    className="w-4 h-4 accent-[#10b981]"
                  />
                  <span className="text-sm font-medium text-slate-700">{algo.name}</span>
                </div>
                <DifficultyBadge level={algo.difficulty} />
              </label>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Selected ({form.algorithms.length})</p>
            <div className="flex flex-wrap gap-2">
              {form.algorithms.map((name) => (
                <span key={name} className="flex items-center gap-1 bg-green-50 text-brand text-xs font-medium px-3 py-1 rounded-full">
                  {name}
                  <button onClick={() => toggleAlgorithm(name)}><X size={12} /></button>
                </span>
              ))}
              {form.algorithms.length === 0 && <span className="text-xs text-slate-400">No algorithms selected yet.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Existing challenge sets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Existing Challenge Sets</h3>
            <p className="text-sm text-slate-500">Manage assignments you have created</p>
          </div>
          <button
            onClick={resetForm}
            className="px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1"
          >
            <Plus size={16} /> New
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 border-y border-slate-100">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Class</th>
              <th className="p-4 font-medium">Difficulty</th>
              <th className="p-4 font-medium">Due Date</th>
              <th className="p-4 font-medium">Algorithms</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                <td className="p-4 font-medium text-slate-700">{c.title}</td>
                <td className="p-4 text-slate-500">{c.className}</td>
                <td className="p-4"><DifficultyBadge level={c.difficulty} /></td>
                <td className="p-4 text-slate-500">{c.due || '—'}</td>
                <td className="p-4 text-slate-500">{(c.algorithms || []).length}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sets.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Chưa có challenge set nào. Tạo mới ở form phía trên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChallengeSets;
