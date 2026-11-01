# AlgoVenture Web Portal

Frontend React cho Admin và Instructor, kết nối Spring Boot API. Xem [hướng dẫn chạy ở thư mục gốc](../README.md).

```sh
npm install
npm run dev
```

Backend phải chạy ở `127.0.0.1:8081`. Vite proxy `/api` tới backend. Khi deploy, dùng reverse proxy cùng origin cho web và `/api`; cấu hình SPA fallback cho các route frontend.

Luồng Instructor theo UC9: chọn lớp → tạo/giao bộ thử thách → theo dõi tiến độ → xem phân tích hoặc xuất kết quả. Danh sách lớp có lối tắt giao thử thách và xem tiến độ. Khi chuyển giữa các mục trong lớp, lớp đang chọn được giữ trong URL. Có thể xuất CSV trực tiếp từ trang lớp hoặc tiến độ; trang xuất kết quả cung cấp thêm JSON.

Giao diện Instructor không còn tải lên hay đính kèm tài liệu. API tài liệu và các liên kết dữ liệu cũ được giữ để tương thích; thay đổi này không xóa dữ liệu đã lưu. Điểm, tiến độ và mức thành thạo vẫn chờ tích hợp kết quả từ game.

Kiểm tra: `npm test`, `npm run lint`, `npm run build`.
