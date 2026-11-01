export class ClassroomRepoError extends Error {
  constructor(code, message) {
    super(
      message ??
        {
          FORBIDDEN: "Bạn không có quyền truy cập dữ liệu này.",
          NOT_FOUND: "Không tìm thấy dữ liệu.",
          STORAGE:
            "Không lưu/đọc được dữ liệu. Hãy kiểm tra quyền lưu trữ và dung lượng trình duyệt.",
        }[code] ??
        "Dữ liệu không hợp lệ.",
    );
    this.name = "ClassroomRepoError";
    this.code = code;
  }
}
