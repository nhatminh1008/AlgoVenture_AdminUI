import { useText } from "../../../preferences/preferencesContext";
export default function ClassroomFilter({ scope }) {
  const text = useText();
  return (
    <label className="min-w-0 sm:min-w-56">
      <span className="sr-only">{text("Chọn lớp học")}</span>
      <select
        className="field"
        value={scope.selected}
        onChange={(event) => scope.select(event.target.value)}
      >
        <option value="">{text("Tất cả lớp của tôi")}</option>
        {scope.invalid && (
          <option value={scope.selected}>{text("Lớp không khả dụng")}</option>
        )}
        {scope.classes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
