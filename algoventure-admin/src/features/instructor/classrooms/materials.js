export const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MATERIAL_TYPES = {
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
