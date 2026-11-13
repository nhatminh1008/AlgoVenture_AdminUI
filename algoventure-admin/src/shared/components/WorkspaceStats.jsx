import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./WorkspaceStats.css";

export function WorkspaceStats({ items }) {
  return (
    <div className="workspace-stats">
      {items.map(({ label, value = 0, icon, tone = "blue", to }) => (
        <div className="workspace-stat" key={label}>
          <div className={`stat-icon tone-${tone}`} aria-hidden="true">{icon}</div>
          <div className="stat-body">
            <span>{label}</span>
            <strong>{typeof value === "number" ? value.toLocaleString("vi-VN") : value ?? 0}</strong>
          </div>
          {to && (
            <Link to={to} className="stat-link" aria-label={`Xem ${label.toLowerCase()}`}>
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
