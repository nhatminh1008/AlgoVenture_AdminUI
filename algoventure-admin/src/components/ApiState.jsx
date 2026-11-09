import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

export function useApiData(path, initial) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(path));
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, setData, error, setError, loading, refresh };
}

export function ApiFeedback({ state, message }) {
  return (
    <>
      {state.loading && (
        <p role="status" className="mb-4 text-sm text-slate-500">
          Đang tải dữ liệu…
        </p>
      )}
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {state.error}{" "}
          <button onClick={state.refresh} className="underline">
            Thử lại
          </button>
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {message}
        </p>
      )}
    </>
  );
}

const pageCopy = {
  "User Management": ["Quản lý tài khoản", "Tạo tài khoản, phân quyền và cập nhật trạng thái."],
  "Classroom Management": ["Quản lý lớp học", "Theo dõi các lớp học, phân công giảng viên và quản lý thành viên."],
  "Content & Levels": ["Thư viện bài học", "Danh sách bài học, chủ đề và độ khó."],
  "Level Configuration": ["Cấu hình bài học", "Điều chỉnh độ khó, mục tiêu và điều kiện mở khóa cho từng bài học."],
  "System Analytics": ["Phân tích hệ thống", "Theo dõi cơ cấu người dùng và các hoạt động quản trị gần đây."],
  "Feature Toggles": ["Quản lý tính năng", "Chủ động bật hoặc tắt các tính năng của nền tảng."],
  Settings: ["Cài đặt nền tảng", "Tùy chỉnh thông tin chung và quản lý dữ liệu AlgoVenture."],
};

export function AdminHeader({ title, description, children }) {
  const [label, subtitle] = pageCopy[title] || [title, description];
  return (
    <header className="admin-page-header">
      <div className="page-heading"><h1>{label}</h1>{(description || subtitle) && <p>{description || subtitle}</p>}</div>
      {children && <div className="page-header-actions">{children}</div>}
    </header>
  );
}
