import React from 'react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui';
import {
  analyticsStats, engagementData, masteryDistribution,
  algorithmDifficulty, strugglingTopics,
} from '../data/mockData';

const Analytics = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Analytics" title="Class Analytics">
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download size={16} /> Download Report
        </button>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-6">
        {analyticsStats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Engagement line */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Class Engagement Over Time</h3>
            <p className="text-sm text-slate-500">Daily active learners over the past 30 days</p>
          </div>
          <span className="text-xs font-medium text-brand bg-green-50 px-3 py-1 rounded-full h-fit flex items-center gap-1">
            ● Daily Active Users
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <Tooltip />
              <Area type="monotone" dataKey="dau" stroke="#10b981" strokeWidth={3} fill="url(#colorDau)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>30 Days Ago</span><span>15 Days Ago</span><span>Today</span>
        </div>
      </div>

      {/* Donut + bar */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Mastery Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">Learner segmentation by mastery level</p>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={masteryDistribution} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
                    {masteryDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">72%</span>
                <span className="text-xs text-slate-400">Avg</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {masteryDistribution.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color }}></span>
                    {m.name}
                  </span>
                  <span className="font-medium text-slate-600">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Algorithm Difficulty</h3>
          <p className="text-sm text-slate-500 mb-4">By average attempts to solve</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={algorithmDifficulty} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="attempts" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Struggling topics */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 mb-1">Struggling Topics</h3>
        <p className="text-sm text-slate-500 mb-4">Topics where students need the most support</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-100">
              <th className="pb-3 font-medium">Topic</th>
              <th className="pb-3 font-medium w-64">Avg Mastery</th>
              <th className="pb-3 font-medium">Failed Attempts</th>
              <th className="pb-3 font-medium">Students At Risk</th>
            </tr>
          </thead>
          <tbody>
            {strugglingTopics.map((t, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="py-3 font-medium text-slate-700">{t.topic}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-40 bg-slate-100 rounded-full h-2">
                      <div className={`${t.color} h-2 rounded-full`} style={{ width: `${t.mastery}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{t.mastery}%</span>
                  </div>
                </td>
                <td className="py-3 text-slate-500">{t.failed}</td>
                <td className="py-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{t.atRisk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
