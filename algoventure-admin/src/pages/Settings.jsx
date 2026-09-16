import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Mini toggle cho trang Settings
const MiniToggle = ({ initialOn }) => {
  const [isOn, setIsOn] = useState(initialOn);
  return (
    <div 
      onClick={() => setIsOn(!isOn)}
      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${isOn ? 'bg-brand' : 'bg-slate-200'}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${isOn ? 'right-0.5' : 'left-0.5'}`}></div>
    </div>
  );
};

const Settings = () => {
  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-1">Admin Console / Settings</p>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* General */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Platform Name</label>
              <input type="text" defaultValue="AlgoVenture" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-slate-800">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Restrict system learner access to update modules</p>
              </div>
              <MiniToggle initialOn={false} />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Authentication</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-sm font-medium text-slate-700">Google Authentication</span>
               <MiniToggle initialOn={true} />
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-slate-100">
               <span className="text-sm font-medium text-slate-700">GitHub Connector</span>
               <MiniToggle initialOn={true} />
             </div>
             <div className="pt-4 mt-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-slate-800">Two-Factor Authentication (2FA)</p>
              </div>
              <MiniToggle initialOn={true} />
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm h-fit flex flex-col justify-between col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-slate-800">Bulk Export Database</p>
              <p className="text-xs text-slate-500">Retrieve a secure copy of all student logs</p>
            </div>
            <button onClick={() => alert("Đang tiến hành tải xuống file CSV...")} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
         <button onClick={() => alert("Đã hoàn tác các thay đổi!")} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Reset to Defaults</button>
         <button onClick={() => alert("Lưu cài đặt thành công!")} className="px-6 py-2 bg-brand text-white font-medium rounded-lg hover:bg-brand-dark">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;