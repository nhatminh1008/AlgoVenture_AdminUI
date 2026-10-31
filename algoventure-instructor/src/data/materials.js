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

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("Trình duyệt không hỗ trợ lưu tài liệu."));
      return;
    }
    const request = indexedDB.open("algoventure.instructor.materials", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("materials", {
        keyPath: "id",
      });
      store.createIndex("classId", "classId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Không mở được kho tài liệu. Hãy kiểm tra quyền lưu trữ của trình duyệt.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Kho tài liệu đang bị khóa. Hãy đóng các tab cũ rồi thử lại.",
        ),
      );
  });
}
async function transact(mode, operation) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("materials", mode);
      const request = operation(transaction.objectStore("materials"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () =>
        reject(
          new Error(
            "Không lưu/đọc được tài liệu. Hãy kiểm tra dung lượng và quyền lưu trữ rồi thử lại.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function listMaterials(classId, instructorId) {
  const rows = await transact("readonly", (store) =>
    store.index("classId").getAll(classId),
  );
  return rows
    .filter((row) => row.instructorId === instructorId)
    .map(({ blob: _blob, ...metadata }) => metadata)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
export async function saveMaterial({
  file,
  title,
  description,
  classId,
  instructorId,
}) {
  const error = validateMaterialFile(file);
  if (error) throw new Error(error);
  if (!classId || !instructorId) throw new Error("Không tìm thấy lớp học.");
  if (!title.trim() || title.trim().length > 120)
    throw new Error("Tên tài liệu cần có từ 1 đến 120 ký tự.");
  if (description.length > 500)
    throw new Error("Mô tả tài liệu tối đa 500 ký tự.");
  const extension = file.name.split(".").at(-1).toLowerCase();
  const material = {
    id: crypto.randomUUID(),
    classId,
    instructorId,
    title: title.trim(),
    description: description.trim(),
    filename: file.name,
    size: file.size,
    type: MATERIAL_TYPES[extension],
    uploadedAt: new Date().toISOString(),
    blob: file.slice(0, file.size, MATERIAL_TYPES[extension]),
  };
  await transact("readwrite", (store) => store.add(material));
  const { blob: _blob, ...metadata } = material;
  return metadata;
}
async function getMaterial(id, classId, instructorId) {
  const item = await transact("readonly", (store) => store.get(id));
  if (!item || item.classId !== classId || item.instructorId !== instructorId)
    throw new Error("Không tìm thấy tài liệu trong lớp này.");
  return item;
}
export async function downloadMaterial(id, classId, instructorId) {
  const item = await getMaterial(id, classId, instructorId);
  const url = URL.createObjectURL(item.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function deleteMaterial(id, classId, instructorId) {
  await getMaterial(id, classId, instructorId);
  await transact("readwrite", (store) => store.delete(id));
}
