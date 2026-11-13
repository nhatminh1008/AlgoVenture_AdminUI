# Danh mục API và kiểm thử AlgoVenture

Portal dùng API của repo [Backend](../Backend/README.md) tại cổng `8081`. Swagger UI có tại `http://127.0.0.1:8081/swagger-ui/index.html`. Xem [luồng tích hợp](INTEGRATION.md) cho API Game và Learner.

## Xác thực và trạng thái dịch vụ

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra Backend |
| GET | `/api/auth/csrf` | Lấy `token` và `headerName` |
| POST | `/api/auth/login` | Đăng nhập bằng `email` và `password` |
| GET | `/api/auth/me` | Đọc tài khoản trong phiên Portal |
| POST | `/api/auth/logout` | Đăng xuất khỏi Portal |
| POST | `/api/auth/password-reset-requests` | Nhận `{email}`, trả 202 với thông báo chung |
| POST | `/api/auth/password-resets` | Nhận `{token,newPassword}`, trả 204 khi thành công |

Portal giữ cookie phiên cùng origin. Khi thử lệnh ghi từ Swagger hoặc Postman, giữ cookie của `GET /api/auth/csrf` và gửi token trong header được chỉ định bởi `headerName`. Lấy lại CSRF sau đăng nhập hoặc đăng xuất. Luồng đặt lại mật khẩu được dùng từ Game.

## Admin

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET, POST | `/api/admin/users` | Liệt kê hoặc tạo tài khoản |
| PUT, DELETE | `/api/admin/users/{userId}` | Cập nhật `name`, `role`, `status` hoặc chuyển tài khoản sang `Deactive` |
| PUT | `/api/admin/me/profile` | Cập nhật hồ sơ Admin |
| PUT | `/api/admin/learners/{learnerId}/profile` | Cập nhật hồ sơ Learner |
| GET, POST | `/api/admin/classes` | Liệt kê hoặc tạo lớp |
| PUT, DELETE | `/api/admin/classes/{classId}` | Cập nhật hoặc lưu trữ lớp |
| PUT | `/api/admin/classes/{classId}/instructor` | Phân công Instructor qua endpoint của Backend. Portal gửi phân công cùng lệnh cập nhật lớp. |
| GET, POST | `/api/admin/classes/{classId}/members` | Liệt kê hoặc thêm thành viên |
| DELETE | `/api/admin/classes/{classId}/members/{userId}` | Gỡ thành viên |
| GET | `/api/admin/algorithms` | Đọc danh mục bài học |
| PUT | `/api/admin/algorithms/{algorithmId}` | Lưu cấu hình bài học |
| GET | `/api/admin/features` | Đọc feature flags |
| PUT | `/api/admin/features/{featureId}` | Cập nhật feature flag |
| GET, PUT | `/api/admin/settings` | Đọc hoặc lưu cài đặt |
| GET | `/api/admin/analytics` | Đọc số liệu tổng hợp |
| GET | `/api/admin/export` | Xuất dữ liệu hệ thống |

Portal lọc tài khoản trên danh sách trả về từ `GET /api/admin/users`. Tài khoản Instructor được quản lý theo vai trò qua cùng API tài khoản. Backend bảo vệ Admin hoạt động cuối cùng khi đổi vai trò hoặc vô hiệu hóa tài khoản.

## Instructor

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/instructor/state` | Đọc lớp, bài giao, quiz, thành viên và tiến độ |
| GET | `/api/instructor/curriculum` | Đọc danh mục bài học |
| GET | `/api/instructor/classes/{classId}/practice` | Đọc minh chứng thực hành của lớp |
| PUT | `/api/instructor/me/profile` | Cập nhật hồ sơ Instructor |
| POST | `/api/instructor/classes` | Tạo lớp |
| PUT, DELETE | `/api/instructor/classes/{classId}` | Cập nhật hoặc lưu trữ lớp |
| POST | `/api/instructor/assignments` | Tạo bài giao |
| PUT, DELETE | `/api/instructor/assignments/{assignmentId}` | Cập nhật hoặc xóa bài giao |
| POST | `/api/instructor/assignments/{assignmentId}/close` | Đóng bài giao |
| POST | `/api/instructor/quizzes` | Tạo quiz |
| PUT, DELETE | `/api/instructor/quizzes/{quizId}` | Cập nhật hoặc xóa quiz |
| GET, POST | `/api/instructor/classes/{classId}/materials` | Liệt kê hoặc tải lên tài liệu qua Backend |
| GET | `/api/instructor/classes/{classId}/materials/{materialId}/download` | Tải xuống tài liệu |
| DELETE | `/api/instructor/classes/{classId}/materials/{materialId}` | Xóa tài liệu |

Portal tải danh sách lớp và bài giao từ `/api/instructor/state`. Portal xuất CSV/JSON theo lớp từ dữ liệu đã tải. Các endpoint tài liệu phục vụ dữ liệu và tích hợp cũ.

## Kiểm tra

- Chạy `npm ci`, `npm run lint`, `npm test` và `npm run build` trong `algoventure-admin`. Chạy `.\mvnw.cmd test` trong repo `Backend`.
- Kiểm tra đăng nhập, tải lại phiên, đăng xuất và giới hạn quyền theo vai trò. Trong DevTools, xem các lệnh gọi qua tab Network và đối chiếu method, URL và mã phản hồi.
- Kiểm tra Admin tạo/sửa tài khoản, kích hoạt lại tài khoản `Deactive`, bảo vệ Admin hoạt động cuối cùng, phân công giảng viên, quản lý thành viên và lưu trữ lớp.
- Kiểm tra Instructor tải lớp, giao bài, soạn quiz, xem tiến độ và xuất kết quả. Kiểm tra các thao tác bị khóa theo `Closed` hoặc `archivedAt`.
- Kiểm tra yêu cầu đặt lại mật khẩu với email hợp lệ và email chưa đăng ký. Cả hai trả 202 với cùng thông báo. Kiểm tra token hợp lệ, hết hạn và đã dùng.
