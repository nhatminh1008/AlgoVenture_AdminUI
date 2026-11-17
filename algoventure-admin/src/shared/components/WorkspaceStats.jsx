import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale, useText } from "../../preferences/preferencesContext";
import "./WorkspaceStats.css";

export function WorkspaceStats({ items, linkComponent: StatLink = Link }) {
  const text = useText();
  const locale = useLocale();
  return (
    <div className="workspace-stats">
      {items.map(({ label, value = 0, icon, tone = "blue", to }) => (
        <div className="workspace-stat" key={label}>
          <div className={`stat-icon tone-${tone}`} aria-hidden="true">{icon}</div>
          <div className="stat-body">
            <span>{label}</span>
            <strong>{typeof value === "number" ? value.toLocaleString(locale) : value ?? 0}</strong>
          </div>
          {to && (
            <StatLink to={to} className="stat-link" aria-label={text(`Xem ${label.toLocaleLowerCase(locale)}`, `View ${label.toLocaleLowerCase(locale)}`)}>
              <ArrowUpRight size={17} />
            </StatLink>
          )}
        </div>
      ))}
    </div>
  );
}
