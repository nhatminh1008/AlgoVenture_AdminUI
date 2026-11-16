import { Search } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";

export function StudentSearch({ query, onQuery }) {
  const text = useText();
  return <div className="instructor-compact-panel flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
    <label className="relative min-w-48 flex-1">
      <span className="sr-only">{text("Tìm sinh viên")}</span>
      <Search size={17} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" />
      <input className="field pl-10" placeholder={text("Tìm tên hoặc email...")} value={query}
        onChange={(event) => onQuery(event.target.value)} />
    </label>
  </div>;
}
