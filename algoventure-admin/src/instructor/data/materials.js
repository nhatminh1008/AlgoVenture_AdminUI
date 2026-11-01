import { api, saveBlob } from "../../api/client.js";
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MATERIAL_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
};

export function validateMaterialFile(file) {
  if (!file || typeof file.name !== "string") return "Vui lòng chọn tài liệu.";
  const extension = file.name.split(".").at(-1).toLowerCase();
  if (!Object.hasOwn(MATERIAL_TYPES, extension))
    return "Chỉ hỗ trợ PDF, DOCX, PPTX và TXT.";
  if (!Number.isFinite(file.size) || file.size <= 0)
    return "Tài liệu không được rỗng.";
  if (file.size > MAX_FILE_SIZE) return "Mỗi tài liệu tối đa 10 MB.";
  return "";
}
export function formatFileSize(size) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function listMaterials(classId) {
  return api(`/instructor/classes/${classId}/materials`);
}
export async function saveMaterial({ file, title, description, classId }) {
  const error = validateMaterialFile(file);
  if (error) throw new Error(error);
  const body = new FormData();
  body.append("file", file);
  body.append("title", title);
  body.append("description", description);
  return api(`/instructor/classes/${classId}/materials`, {
    method: "POST",
    body,
  });
}
export async function downloadMaterial(id, classId) {
  const rows = await listMaterials(classId);
  const item = rows.find((row) => row.id === id);
  if (!item) throw new Error("Không tìm thấy tài liệu.");
  const blob = await api(
    `/instructor/classes/${classId}/materials/${id}/download`,
    { download: true },
  );
  saveBlob(blob, item.filename);
}
export function deleteMaterial(id, classId) {
  return api(`/instructor/classes/${classId}/materials/${id}`, {
    method: "DELETE",
  });
}
