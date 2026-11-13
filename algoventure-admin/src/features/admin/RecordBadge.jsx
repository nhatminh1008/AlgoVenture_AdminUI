import { roleLabels, statusLabels } from "./recordLabels.js";

export default function RecordBadge({ value, role = false }) {
  const tone = role ? "role" : ["Active", "Published"].includes(value) ? "active" : ["Pending", "Draft"].includes(value) ? "pending" : ["Suspended", "Inactive", "Deactive"].includes(value) ? "inactive" : "neutral";
  return <span className={`record-badge record-badge-${tone}`}>{(role ? roleLabels : statusLabels)[value] || value}</span>;
}
