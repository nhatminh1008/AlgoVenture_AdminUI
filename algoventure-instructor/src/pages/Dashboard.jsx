import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Users, Activity, Target, Clock, Download, Plus } from 'lucide-react';
import { StatCard, StatusBadge, InlineBar, PageHeader } from '../components/ui';
import {
  summaryStats, activityData, topicCompletion,
  recentStudents, activeChallenges,
} from '../data/mockData';

const ICONS = [<Users size={20} />, <Activity size={20} />, <Target size={20} />, <Clock size={20} />];

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader breadcrumb="Instructor / Dashboard" title="Class Overview">
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download size={16} /> Export Reports
        </button>
        <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center gap-2">
          <Plus size={16} /> Assign Challenge
        </button>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-6">
        {summaryStats.map((stat, i) => (
          <StatCard key={i} {...stat} icon={ICONS[i]} />
        ))}
      </div>

      {/* Chart + Topic completion */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Learning Activity</h3>
              <p className="text-sm text-slate-500">Daily practice submissions (Last 30 days)</p>
            </div>
            <span className="text-xs font-medium text-brand bg-green-50 px-3 py-1 rounded-full h-fit flex items-center gap-1">
              ● Active Sessions
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Area type="monotone" dataKey="subs" stroke="#10b981" strokeWidth={3} fill="url(#colorSubs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>30 Days Ago</span><span>15 Days Ago</span><span>Today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Topic Completion</h3>
          <p className="text-sm text-slate-500 mb-6">Class adoption across core topics</p>
          <div className="space-y-5">
            {topicCompletion.map((topic, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>{topic.name}</span>
                  <span>{topic.val}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${topic.color} h-2 rounded-full`} style={{ width: `${topic.val}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{topic.learners} learners</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent students + Active challenges */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Recent Student Activity</h3>
              <p className="text-sm text-slate-500">Latest learners active in your class</p>
            </div>
            <button className="text-sm font-medium border rounded-lg px-4 py-2 hover:bg-slate-50">View All</button>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Topic</th>
                <th className="pb-3 font-medium">Mastery</th>
                <th className="pb-3 font-medium">Last Active</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <span className="font-medium text-slate-700">{s.name}</span>
                  </td>
                  <td className="py-3 text-slate-500">{s.topic}</td>
                  <td className="py-3"><InlineBar value={s.mastery} /></td>
                  <td className="py-3 text-slate-500">{s.lastActive}</td>
                  <td className="py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Active Challenge Sets</h3>
          <p className="text-sm text-slate-500 mb-6">Assignments in progress</p>
          <div className="space-y-5">
            {activeChallenges.map((c, i) => {
              const pct = Math.round((c.submitted / c.total) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-700 text-sm">{c.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{c.due}</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-brand h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{c.submitted}/{c.total} submitted</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
