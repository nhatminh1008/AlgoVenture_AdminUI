import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Sliders, 
  BarChart2, ToggleLeft, Settings, LogOut 
} from 'lucide-react';

const Layout = () => {
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/users', name: 'User Management', icon: <Users size={20} /> },
    { path: '/content', name: 'Content & Levels', icon: <BookOpen size={20} /> },
    { path: '/levels', name: 'Level Config', icon: <Sliders size={20} /> },
    { path: '/analytics', name: 'System Analytics', icon: <BarChart2 size={20} /> },
    { path: '/features', name: 'Feature Toggles', icon: <ToggleLeft size={20} /> },
    { path: '/settings', name: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">∴</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">AlgoVenture</h1>
            <p className="text-brand text-xs font-semibold tracking-wider">ADMIN CONSOLE</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-brand border-l-4 border-brand' 
                    : 'hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700 m-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-white font-medium text-sm">Alex Rivera</p>
              <p className="text-xs text-slate-400">System Lead</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;