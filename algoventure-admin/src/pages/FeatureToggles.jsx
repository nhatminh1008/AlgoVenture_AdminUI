import React from 'react';

const ToggleSwitch = ({ title, desc, isOn, isPrimary = true }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
    <div>
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
    <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isOn ? (isPrimary ? 'bg-brand' : 'bg-blue-500') : 'bg-slate-200'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isOn ? 'right-1' : 'left-1'}`}></div>
    </div>
  </div>
);

const FeatureToggles = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-1">Admin Console / Features</p>
        <h1 className="text-3xl font-bold text-slate-900">Feature Toggles</h1>
      </div>

      <div className="space-y-6 mb-8">
        {/* Group 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Learning Features</h3>
          <p className="text-sm text-slate-500 mb-4 border-b pb-4">Control core learning experience and DSA visualization modules</p>
          <ToggleSwitch title="Adaptive Difficulty" desc="Dynamically adjustments challenge levels based on student progress and performance" isOn={true} />
          <ToggleSwitch title="Visualizer Sandbox" desc="Enables free-form playground where students can type custom input code to construct visualizer steps" isOn={true} />
          <ToggleSwitch title="Gamified XP Rewards" desc="Grants instant XP points, levels, and animations upon complete visualization challenges" isOn={true} />
          <ToggleSwitch title="Practice Mode" desc="Allows students to repeat completed levels without affecting current leaderboard rankings" isOn={true} />
        </div>

        {/* Group 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Social Features</h3>
          <p className="text-sm text-slate-500 mb-4 border-b pb-4">Manage collaborative and competitive community gamification elements</p>
          <ToggleSwitch title="Leaderboard" desc="Publicly displays top-performing learners based on weekly XP achievements" isOn={true} />
          <ToggleSwitch title="Achievements & Badges" desc="Awards visual achievements and level progress indicators shown on public profile cards" isOn={true} />
          <ToggleSwitch title="Study Groups" desc="Facilitates peer-to-peer visual execution sandbox sharing and workspace groups" isOn={false} />
        </div>

        {/* Group 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">System Features</h3>
          <p className="text-sm text-slate-500 mb-4 border-b pb-4">Platform-wide baseline modules and operational configurations</p>
          <ToggleSwitch title="Offline Mode" desc="Allows caching of recently visited visualizations for spotty connectivity" isOn={true} />
          <ToggleSwitch title="Bilingual Support" desc="Enables Vietnamese translation context mappings on UI and instructions" isOn={true} />
          <ToggleSwitch title="Dark Mode" desc="Switches global learning portal style from default warm paper to slate" isOn={false} />
          <ToggleSwitch title="Beta Features" desc="Exposes early stage visualizations still undergoing compiler testing" isOn={false} />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-brand text-white font-medium rounded-lg hover:bg-brand-dark">Save Changes</button>
      </div>
    </div>
  );
};

export default FeatureToggles;