import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: '30 Days Ago', acts: 400 },
  { name: '25 Days Ago', acts: 600 },
  { name: '20 Days Ago', acts: 800 },
  { name: '15 Days Ago', acts: 700 },
  { name: '10 Days Ago', acts: 1200 },
  { name: '5 Days Ago', acts: 1000 },
  { name: 'Today', acts: 1642 },
];

const mockRegistrations = [
  { name: 'Siddharth Mehta', email: 'sid@algoventure.edu', role: 'Learner', date: 'Oct 24, 2024', status: 'Active' },
  { name: 'Elena Rostova', email: 'elena.r@cs...', role: 'Instructor', date: 'Oct 23, 2024', status: 'Active' },
  { name: 'Marcus Brody', email: 'm.brody@vis...', role: 'Learner', date: 'Oct 23, 2024', status: 'Pending' },
];

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin Console / Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Export Reports</button>
          <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center gap-2">
            + Create Custom Level
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: 'Total Registered Users', value: '12,847', trend: '+ 12.5%', isUp: true },
          { title: 'Active Learners', value: '3,291', trend: '+ 8.2%', isUp: true },
          { title: 'Active Instructors', value: '156', trend: '- 2.1%', isUp: false },
          { title: 'Visualizations Completed', value: '8,420', trend: '+ 24.8%', isUp: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium mb-2">{stat.title}</h3>
            <div className="text-3xl font-bold text-slate-800 mb-2">{stat.value}</div>
            <div className={`text-xs font-medium ${stat.isUp ? 'text-brand' : 'text-red-500'}`}>
              {stat.trend} vs last month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Learning Activity</h3>
              <p className="text-sm text-slate-500">Daily visual execution and sandbox submissions (Last 30 days)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Line type="monotone" dataKey="acts" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Completion */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">Topic Completion</h3>
          <p className="text-sm text-slate-500 mb-6">Adoption rate across core topics</p>
          
          <div className="space-y-5">
            {[
              { name: 'Sorting Algorithms', val: 78, color: 'bg-brand' },
              { name: 'Searching Algorithms', val: 65, color: 'bg-blue-500' },
              { name: 'Dynamic Programming', val: 52, color: 'bg-orange-500' },
              { name: 'Graphs & Pathfinding', val: 38, color: 'bg-purple-500' },
            ].map((topic, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>{topic.name}</span>
                  <span>{topic.val}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${topic.color} h-2 rounded-full`} style={{ width: `${topic.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="font-bold text-lg text-slate-800">Recent Registrations</h3>
                <p className="text-sm text-slate-500">Latest users joining the adaptive visualization space</p>
             </div>
             <button className="text-sm font-medium border rounded-lg px-4 py-2 hover:bg-slate-50">View All Users</button>
           </div>
           <table className="w-full text-left text-sm">
             <thead>
               <tr className="text-slate-500 border-b border-slate-100">
                 <th className="pb-3 font-medium">Name</th>
                 <th className="pb-3 font-medium">Email</th>
                 <th className="pb-3 font-medium">Role</th>
                 <th className="pb-3 font-medium">Joined Date</th>
                 <th className="pb-3 font-medium">Status</th>
               </tr>
             </thead>
             <tbody>
               {mockRegistrations.map((user, i) => (
                 <tr key={i} className="border-b border-slate-50 last:border-0">
                   <td className="py-3 flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                     <span className="font-medium text-slate-700">{user.name}</span>
                   </td>
                   <td className="py-3 text-slate-500">{user.email}</td>
                   <td className="py-3"><span className="text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">{user.role}</span></td>
                   <td className="py-3 text-slate-500">{user.date}</td>
                   <td className="py-3">
                     <span className={`px-2 py-1 rounded text-xs font-medium ${
                       user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                     }`}>
                       {user.status}
                     </span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
        
        {/* System Health */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800">System Health</h3>
          <p className="text-sm text-slate-500 mb-6">Live production performance matrix</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">SERVER UPTIME</p>
                <p className="font-bold text-xl">99.97%</p>
              </div>
              <span className="text-brand text-sm font-medium flex items-center gap-1">● Healthy</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">API LATENCY</p>
                <p className="font-bold text-xl">42 ms</p>
              </div>
              <span className="text-brand text-sm font-medium flex items-center gap-1">● Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;