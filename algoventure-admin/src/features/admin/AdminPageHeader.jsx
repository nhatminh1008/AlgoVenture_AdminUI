import { useText } from "../../preferences/preferencesContext";
const pageCopy = {
  "User Management": ["Quản lý tài khoản", "Tạo tài khoản, xem hồ sơ và khóa quyền đăng nhập."],
  "Classroom Management": ["Quản lý lớp học", "Xem lớp học và quản lý trạng thái khóa."],
  "Content & Levels": ["Thư viện bài học", "Danh sách bài học, chủ đề và độ khó."],
  "Level Configuration": ["Cấu hình bài học", "Điều chỉnh độ khó, mục tiêu và điều kiện mở khóa cho từng bài học."],
  "System Analytics": ["Phân tích hệ thống", "Theo dõi cơ cấu người dùng và các hoạt động quản trị gần đây."],
  "Feature Toggles": ["Quản lý tính năng", "Chủ động bật hoặc tắt các tính năng của nền tảng."],
  Settings: ["Cài đặt nền tảng", "Tùy chỉnh thông tin chung và quản lý dữ liệu AlgoVenture."],
};

export function AdminPageHeader({ title, description, children }) {
  const text = useText();
  const [label, subtitle] = pageCopy[title] || [title, description];
  return (
    <header className="admin-page-header">
      <div className="page-heading"><h1>{text(label)}</h1>{(description || subtitle) && <p>{text(description || subtitle)}</p>}</div>
      {children && <div className="page-header-actions">{children}</div>}
    </header>
  );
}
