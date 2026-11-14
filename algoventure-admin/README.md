# AlgoVenture Web Portal

Frontend React cho Admin và Instructor, kết nối Spring Boot API. Xem [hướng dẫn chạy ở thư mục gốc](../README.md).

Máy mới cần Node.js 22.12 trở lên và npm. Clone [AlgoVenture_Backend](../../AlgoVenture_Backend/README.md) cùng cấp với repo AdminUI, chạy `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -PrepareOnly` trong Backend rồi Run `AlgoVentureApplication` bằng JDK 21. Setup Windows mới sinh mật khẩu Admin/Instructor trong file `.runtime/dev-secrets.json` của Backend và bật seed cho lần khởi động đầu. Xem README Backend để lấy đúng khóa mật khẩu hoặc dùng cách thiết lập thủ công. Lệnh dưới đây chạy từ thư mục `algoventure-admin`:

```sh
npm ci
npm run dev
```

Backend phải chạy ở `127.0.0.1:8081`. Mở Portal tại `http://127.0.0.1:5174`; cổng này phải trống. Vite proxy `/api` tới backend. Khi deploy, dùng reverse proxy cùng origin cho web và `/api`; cấu hình SPA fallback cho các route frontend.

Luồng Instructor theo UC9: chọn lớp → tạo/giao bộ thử thách → theo dõi tiến độ → xem phân tích hoặc xuất kết quả. Danh sách lớp có lối tắt giao thử thách và xem tiến độ. Khi chuyển giữa các mục trong lớp, lớp đang chọn được giữ trong URL. Có thể xuất CSV trực tiếp từ trang lớp hoặc tiến độ; trang xuất kết quả cung cấp thêm JSON.

Giao diện Instructor không còn tải lên hay đính kèm tài liệu. API tài liệu và các liên kết dữ liệu cũ được giữ để tương thích; thay đổi này không xóa dữ liệu đã lưu. Điểm quiz và tiến độ bài giao lấy từ Backend.

Kiểm tra: `npm test`, `npm run lint`, `npm run build`.

Giao diện dùng màu xanh dương, sidebar theo vai trò, tìm trang bằng `Ctrl+K` và danh sách lớp dạng thẻ hoặc bảng. Các trang dùng chung kiểu nút, biểu mẫu, bảng dữ liệu và trạng thái. Menu chuyển sang dạng thu gọn trên điện thoại.

Logo SVG nằm trong `public/brand`: biểu tượng, bản chữ dùng trên nền sáng và bản chữ dùng trên nền tối. Ảnh `public/images/algoventure-learning-map.png` được sao chép nguyên bản từ `AlgoVenture_Unity/Documentation/Previews/Map_Web.png`; đây là ảnh bản đồ học tập của dự án Unity, không phải ảnh minh họa tạo mới.

Test đối chiếu curriculum ưu tiên repo [AlgoVenture_Backend](../../AlgoVenture_Backend/README.md) bên cạnh AdminUI và hỗ trợ các cấu trúc thư mục cũ. Nếu đặt backend ở vị trí khác, đặt `BACKEND_CURRICULUM_PATH` tới tệp `src/main/resources/curriculum.json` trước khi chạy `npm test`.
