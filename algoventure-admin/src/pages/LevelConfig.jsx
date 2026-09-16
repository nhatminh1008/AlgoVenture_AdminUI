import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

const LevelConfig = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin Console / Levels</p>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight w-48">Level Configuration</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50">
            Discard
          </button>
          <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark">
            Save Configuration
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[700px]">
        {/* Sidebar */}
        <div className="w-1/3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Algorithm Hierarchy</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter..." 
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 text-sm">
            <div className="mb-4">
              <div className="flex items-center gap-1 text-slate-500 font-bold mb-2 uppercase text-xs tracking-wider">
                <ChevronDown size={14} /> SORTING ALGORITHMS
              </div>
              <div className="pl-5 space-y-1">
                <div className="flex items-center gap-2 bg-green-50 text-brand px-3 py-2 rounded-md font-medium cursor-pointer">
                  <span className="text-brand">📄</span> Bubble Sort
                </div>
                <div className="flex items-center gap-2 text-slate-600 px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
                  <span className="text-slate-400">📄</span> Selection Sort
                </div>
                <div className="flex items-center gap-2 text-slate-600 px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
                  <span className="text-slate-400">📄</span> Insertion Sort
                </div>
                <div className="flex items-center gap-2 text-slate-600 px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
                  <span className="text-slate-400">📄</span> Merge Sort
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-slate-500 font-bold mb-2 uppercase text-xs tracking-wider">
                <ChevronDown size={14} /> SEARCHING ALGORITHMS
              </div>
              <div className="pl-5 space-y-1">
                <div className="flex items-center gap-2 text-slate-600 px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
                  <span className="text-slate-400">📄</span> Linear Search
                </div>
                <div className="flex items-center gap-2 text-slate-600 px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
                  <span className="text-slate-400">📄</span> Binary Search
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-y-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Level Details: Bubble Sort Basics</h2>
          <p className="text-sm text-slate-500 mb-6">Configure learning paths, star thresholds, and constraints for this node</p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level Display Name</label>
              <input type="text" defaultValue="Bubble Sort Basics" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Rating</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Star Thresholds (Point Requirements)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">1-Star Threshold</label>
                <input type="text" defaultValue="100 pts" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">2-Star Threshold</label>
                <input type="text" defaultValue="200 pts" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">3-Star Threshold</label>
                <input type="text" defaultValue="300 pts" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (Seconds)</label>
              <input type="text" defaultValue="300" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hints Allowed</label>
              <div className="w-10 h-6 bg-brand rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Prerequisite Levels</label>
            <div className="border border-slate-200 rounded-lg p-2 flex gap-2 flex-wrap items-center">
              <span className="bg-green-50 text-brand text-xs font-medium px-2 py-1 rounded">Arrays Intro</span>
              <span className="bg-green-50 text-brand text-xs font-medium px-2 py-1 rounded">Complexity Basics</span>
              <ChevronDown size={14} className="text-slate-400 ml-auto mr-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Visualizer Initial State Preview</label>
            <div className="bg-sidebar rounded-lg p-4 h-48 relative overflow-hidden flex items-end justify-center gap-2 pb-4">
               <span className="absolute top-3 left-3 text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded opacity-50">Visual Sandbox Mode</span>
               {/* Giả lập các thanh thuật toán */}
               {[40, 70, 50, 30, 80, 50].map((height, i) => (
                 <div key={i} className="w-8 bg-brand rounded-t-sm" style={{ height: `${height}%` }}></div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelConfig;