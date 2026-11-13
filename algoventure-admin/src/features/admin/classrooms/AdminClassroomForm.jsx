import { levels, topics } from "../../../shared/curriculum/curriculumCatalog";

export default function AdminClassroomForm({
  editor,
  instructors,
  usersById,
  isSubmitting,
  onSubmit,
  onChange,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="panel mb-6 p-6" aria-label={editor.id ? "Sửa lớp học" : "Tạo lớp học"}>
      <h2 className="mb-4 text-lg font-bold">{editor.id ? "Sửa lớp học" : "Tạo lớp học"}</h2>
      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={isSubmitting}>
        <label><span className="field-label">Tên lớp</span>
          <input className="field" required maxLength={100} value={editor.name}
            onChange={(event) => onChange({ ...editor, name: event.target.value })} />
        </label>
        <label><span className="field-label">Giảng viên phụ trách</span>
          <select className="field" required value={editor.instructorId}
            onChange={(event) => onChange({ ...editor, instructorId: event.target.value })}>
            <option value="">Chọn giảng viên</option>
            {editor.instructorId && !instructors.some(({ id }) => id === editor.instructorId) && (
              <option value={editor.instructorId} disabled>{usersById.get(editor.instructorId)?.name ?? "Giảng viên hiện tại"} (không hoạt động)</option>
            )}
            {instructors.map(({ id, name, email }) => <option key={id} value={id}>{name} ({email})</option>)}
          </select>
        </label>
        <label><span className="field-label">Chủ đề</span>
          <select className="field" required value={editor.topicId}
            onChange={(event) => onChange({ ...editor, topicId: event.target.value })}>
            <option value="">Chọn chủ đề</option>
            {topics.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label><span className="field-label">Cấp độ</span>
          <select className="field" required value={editor.level}
            onChange={(event) => onChange({ ...editor, level: event.target.value })}>
            {levels.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2"><span className="field-label">Mô tả</span>
          <textarea className="field" maxLength={500} value={editor.description}
            onChange={(event) => onChange({ ...editor, description: event.target.value })} />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!editor.name.trim() ||
            !instructors.some(({ id }) => id === editor.instructorId)}>Lưu lớp học</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>Hủy</button>
        </div>
      </fieldset>
    </form>
  );
}
