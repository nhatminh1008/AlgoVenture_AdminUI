export const ProgressMeter = ({ completed, total, percent }) => {
  if (!total) return <span className="text-xs text-slate-500">Chưa giao bài</span>;
  return <div className="instructor-progress"><div className="instructor-progress-label"><span>{completed}/{total} bài</span><strong>{percent}%</strong></div><progress max="100" value={percent} aria-label={`Hoàn thành ${completed} trên ${total} bài`} /></div>;
};
