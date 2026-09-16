import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';

const mockUsers = [
  { name: 'Nguyen Hoang Anh', email: 'hoanganh.nguyen@algoventure.edu', role: 'Learner', joined: 'Oct 24, 2024', active: '5 mins ago', status: 'Active' },
  { name: 'Sarah Jenkins', email: 'sarah.j@algoventure.edu', role: 'Instructor', joined: 'Oct 24, 2024', active: '1 hour ago', status: 'Active' },
  { name: 'Phan Thanh Thao', email: 'thanhthao.p@algoventure.edu', role: 'Learner', joined: 'Oct 22, 2024', active: '3 days ago', status: 'Pending' },
  { name: 'Le Quoc Khanh', email: 'quockhanh.le@algoventure.edu', role: 'Admin', joined: 'Oct 21, 2024', active: 'Just now', status: 'Active' },
  { name: 'Marcus Brody', email: 'm.brody@algoventure.edu', role: 'Learner', joined: 'Oct 20, 2024', active: '2 weeks ago', status: 'Suspended' },
];

const UserManagement = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin Console / Users</p>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight w-48">User Management</h1>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark flex items-center gap-2">
          + Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name, email..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand"
            />
          </div>
          <select className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white">
            <option>Role: All</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-4 py-2 text-slate-600 bg-white">
            <option>Status: All</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm">
          <thead className="bg-white">
            <tr className="text-slate-500 border-b border-slate-100">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Joined Date</th>
              <th className="p-4 font-medium">Last Active</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-300"></div>
                  <span className="font-bold text-slate-800">{user.name}</span>
                </td>
                <td className="p-4 text-slate-500">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-orange-100 text-orange-700' :
                    user.role === 'Instructor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{user.joined}</td>
                <td className="p-4 text-slate-500">{user.active}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.status === 'Active' ? 'bg-green-100 text-green-700' :
                    user.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 text-slate-400">
                    <button className="hover:text-brand"><Edit2 size={16} /></button>
                    <button className="hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
          <span>Showing 1-5 of 247 users</span>
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

export default UserManagement;