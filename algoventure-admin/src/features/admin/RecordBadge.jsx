import { useText } from "../../preferences/preferencesContext";
import { roleLabels, statusLabels } from "./recordLabels.js";

export default function RecordBadge({ value, role = false }) {
  const text = useText();
  const tone = role ? "role" : ["Active", "Publish"].includes(value) ? "active" : ["Draft", "Unpublished"].includes(value) ? "pending" : ["Suspended", "Inactive", "Deactive"].includes(value) ? "inactive" : "neutral";
  return <span className={`record-badge record-badge-${tone}`}>{text((role ? roleLabels : statusLabels)[value] || value)}</span>;
}
