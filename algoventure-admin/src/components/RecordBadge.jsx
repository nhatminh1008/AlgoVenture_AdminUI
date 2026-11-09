export const roleLabels = { admin: "Quản trị viên", instructor: "Giảng viên", learner: "Học viên" };
export const statusLabels = { Active: "Hoạt động", Published: "Đã công bố", Pending: "Chờ duyệt", Draft: "Bản nháp", Suspended: "Tạm khóa", Inactive: "Không hoạt động", Closed: "Đã đóng" };
export const actionLabel = (action) => ({
  "assignment.save": "Lưu bộ thử thách",
  "classroom.save": "Lưu lớp học",
  "learner.register": "Đăng ký tài khoản học viên",
  "quiz.save": "Lưu bài trắc nghiệm",
  "quiz.delete": "Xóa bài trắc nghiệm",
  "user.create": "Tạo tài khoản",
  "user.update": "Cập nhật tài khoản",
  "algorithm.configure": "Cấu hình bài học",
  "feature.configure": "Cấu hình tính năng",
  "settings.save": "Lưu cài đặt",
  "material.upload": "Tải lên tài liệu",
  "material.delete": "Xóa tài liệu",
  "enrollment.create": "Thêm học viên vào lớp",
  "enrollment.remove": "Gỡ học viên khỏi lớp",
}[action] || action);

export default function RecordBadge({ value, role = false }) {
  const tone = role ? "role" : ["Active", "Published"].includes(value) ? "active" : ["Pending", "Draft"].includes(value) ? "pending" : ["Suspended", "Inactive"].includes(value) ? "inactive" : "neutral";
  return <span className={`record-badge record-badge-${tone}`}>{(role ? roleLabels : statusLabels)[value] || value}</span>;
}
