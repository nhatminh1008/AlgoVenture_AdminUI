import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockChartData = [
  { name: '30 Days Ago', users: 1200 },
  { name: '25 Days Ago', users: 1500 },
  { name: '20 Days Ago', users: 1400 },
  { name: '15 Days Ago', users: 2100 },
  { name: '10 Days Ago', users: 2600 },
  { name: '5 Days Ago', users: 2300 },
  { name: 'Today', users: 3420 },
];

const pieData = [
  { name: 'Learners', value: 82, color: '#10b981' },
  { name: 'Instructors', value: 12, color: '#f59e0b' },
  { name: 'Admins', value: 6, color: '#ef4444' },
];

const mockLogs = [
  { time: '10:42:15 AM', endpoint: '/api/visualize/quicksort', method: 'POST', status: 200, latency: '24ms' },
  { time: '10:41:58 AM', endpoint: '/api/levels/binarysearch/3', method: 'GET', status: 200, latency: '12ms' },
  { time: '10:41:12 AM', endpoint: '/api/user/profile/update', method: 'PUT', status: 404, latency: '42ms' },
  { time: '10:40:02 AM', endpoint: '/api/sandbox/compile', method: 'POST', status: 500, latency: '285ms' },
  { time: '10:39:45 AM', endpoint: '/api/analytics/export', method: 'GET', status: 200, latency: '110ms' },
];

const SystemAnalytics = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin Console / Analytics</p>
          <h1 className="text-3xl font-bold text-slate-900">System Analytics</h1>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
          Download Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: 'Total API Requests', value: '1,248,930', trend: '+ 14.2%', icon: '📈' },
          { title: 'Avg Response Time', value: '42 ms', trend: '↓ 4.8%', icon: '⏱' },
          { title: 'Error Rate', value: '0.32%', trend: '↓ 12.5%', icon: '⚠️' },
          { title: 'Server Uptime', value: '99.97%', trend: '→ Stable', icon: '🛡️' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute top-4 right-4 text-slate-300">{stat.icon}</span>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
            <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
            <div className={`text-xs font-medium ${stat.trend.includes('↓') || stat.trend.includes('→') ? 'text-brand' : 'text-brand'}`}>
              {stat.trend} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Platform Usage Over Time</h3>
              <p className="text-sm text-slate-500">Daily active users over the past 30 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
               <span className="w-3 h-3 bg-brand rounded-sm"></span> Daily Active Users (DAU)
            </div>
         </div>
         <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={mockChartData}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Users by Role Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Users by Role</h3>
          <p className="text-sm text-slate-500 mb-4">Active user segmentation distribution</p>
          <div className="flex items-center">
            <div className="w-32 h-32 relative">
               <ResponsiveContainer>
                 <PieChart>
                   <Pie data={pieData} innerRadius={40} outerRadius={60} dataKey="value">
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="font-bold text-slate-800">82%</span>
                 <span className="text-[10px] text-slate-500">Learners</span>
               </div>
            </div>
            <div className="ml-8 space-y-3 flex-1">
               {pieData.map(role => (
                 <div key={role.name} className="flex justify-between text-sm">
                   <div className="flex items-center gap-2 text-slate-600 font-medium">
                     <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: role.color }}></span>
                     {role.name}
                   </div>
                   <span className="text-slate-500">{role.value}%</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Algorithm Popularity */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Algorithm Popularity</h3>
          <p className="text-sm text-slate-500 mb-6">Top algorithms by solve attempts</p>
          <div className="space-y-4">
            {[
              { name: 'Quick Sort', val: 95 },
              { name: 'Binary Search', val: 88 },
              { name: 'BFS', val: 72 },
              { name: 'Merge Sort', val: 65 },
              { name: 'Dijkstra', val: 48 },
            ].map(algo => (
              <div key={algo.name}>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>{algo.name}</span>
                  <span>{algo.val}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-brand h-1.5 rounded-full" style={{ width: `${algo.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 mb-1">Performance Logs</h3>
        <p className="text-sm text-slate-500 mb-4">Realtime API traffic and response latencies</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 font-medium border-b border-slate-100">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Endpoint</th>
              <th className="pb-3">Method</th>
              <th className="pb-3">Status Code</th>
              <th className="pb-3 text-right">Response Time</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 text-slate-600">
                <td className="py-3 text-slate-400 text-xs">{log.time}</td>
                <td className="py-3 font-medium">{log.endpoint}</td>
                <td className="py-3 text-xs text-slate-500">{log.method}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    log.status === 200 ? 'bg-green-100 text-green-700' :
                    log.status === 404 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{log.status}</span>
                </td>
                <td className="py-3 text-right">{log.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemAnalytics;