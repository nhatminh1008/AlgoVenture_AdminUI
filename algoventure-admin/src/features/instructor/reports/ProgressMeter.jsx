import { useText } from "../../../preferences/preferencesContext";
export const ProgressMeter = ({ completed, total, percent }) => {
  const text = useText();
  if (!total) return <span className="text-xs text-slate-500">{text("Chưa giao bài")}</span>;
  return <div className="instructor-progress"><div className="instructor-progress-label"><span>{completed}/{total} {text(" bài")}</span><strong>{percent}%</strong></div><progress max="100" value={percent} aria-label={text(`Hoàn thành ${completed} trên ${total} bài`, `${completed} of ${total} items completed`)} /></div>;
};
