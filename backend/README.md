# AlgoVenture Spring Boot API

Java 21, Spring Boot 3.5.16, Spring Security, Bean Validation, Spring JDBC, Flyway 11.20.3 và PostgreSQL. Maven Wrapper đi kèm, không cần Maven hệ thống. Cách chạy Windows local và tài khoản bootstrap ở [README gốc](../README.md).

## Backend chung cho Learner

Game đã chuyển về backend này. API tài khoản, hồ sơ, tiến trình, bảng xếp hạng và Classroom được mô tả trong [INTEGRATION.md](../INTEGRATION.md). Portal dùng cookie + CSRF; Learner dùng Bearer session do backend này cấp.

## Cấu trúc

- `SecurityConfig`, `AuthController`, `UserStore`: xác thực session, BCrypt, CSRF, kiểm tra vai trò và trạng thái tài khoản ở mỗi request.
- `PortalStore`: transaction và các quy tắc nghiệp vụ cho lớp, assignment, quiz; mọi truy cập Instructor đều ràng buộc instructor ID từ phiên đăng nhập.
- `InstructorController`: REST endpoints và lưu/tải file.
- `AdminController`: tài khoản, phân công giảng viên, thành viên, cấu hình và thống kê.
- `PortalDtos`: validation đầu vào, bao gồm giới hạn câu hỏi, lựa chọn và điểm.
- `Catalog`, `SeedData`: danh mục bài và tài khoản khởi tạo có điều kiện.
- `db/migration/V1__portal.sql`: schema có khóa ngoại, unique constraints và indexes.

JDBC dùng truy vấn tham số cho dữ liệu do client cung cấp. ID được server sinh; client không quyết định chủ sở hữu. Session cookie HttpOnly, SameSite=Lax, thời hạn không hoạt động 8 giờ. Cookie chỉ mang session ID, thông tin phiên ở server. Khởi động lại backend làm hết hiệu lực các phiên đang mở nhưng không xóa dữ liệu database.

## API

### Swagger UI

Sau khi chạy backend, mở http://127.0.0.1:8081/swagger-ui/index.html.
OpenAPI JSON: http://127.0.0.1:8081/v3/api-docs. API được nhóm thành Auth, Admin và Instructor.

Trong Swagger, mở endpoint và bấm **Try it out → Execute**:

1. Gọi `GET /api/auth/csrf` để nhận cookie CSRF.
2. Gọi `POST /api/auth/login` với JSON email và password của tài khoản local.
3. Gọi lại `GET /api/auth/csrf` vì đăng nhập làm đổi token.
4. Thử các API theo vai trò đã đăng nhập. Swagger tự gửi cookie phiên và header `X-XSRF-TOKEN`; không cần nhập cookie vào Authorize.
5. Gọi `POST /api/auth/logout` để đăng xuất; lấy lại CSRF trước lần đăng nhập tiếp theo.

Dùng cùng hostname trong suốt phiên (ví dụ `127.0.0.1`). Trang tài liệu được phép truy cập công khai;
các API nghiệp vụ vẫn yêu cầu đăng nhập, đúng vai trò và CSRF cho thao tác ghi.
Có thể tắt tài liệu khi triển khai bằng `SPRINGDOC_API_DOCS_ENABLED=false` và `SPRINGDOC_SWAGGER_UI_ENABLED=false`.

Tất cả route bắt đầu bằng `/api`. Request JSON dùng `Content-Type: application/json`. Trước POST/PUT/DELETE, gọi `GET /api/auth/csrf`, giữ cookie và gửi token trả về trong header `X-XSRF-TOKEN`. Sau login/logout, lấy token mới trước request ghi tiếp theo. Browser cần `credentials: include`; frontend đã xử lý việc này.

| Method | Route | Chức năng |
| --- | --- | --- |
| GET | /health | Liveness của tiến trình |
| GET | /auth/csrf | Lấy token CSRF |
| POST | /auth/login | `{email,password}`, trả hồ sơ và cookie phiên |
| GET | /auth/me | Hồ sơ tài khoản trong phiên |
| POST | /auth/logout | Hủy phiên, trả 204 |
| GET | /instructor/state | Lớp, bài giao, quiz, thành viên thuộc Instructor hiện tại |
| GET | /instructor/curriculum | Danh mục 25 mã bài |
| POST | /instructor/classes | Tạo lớp |
| PUT | /instructor/classes/{id} | Sửa lớp |
| POST / PUT | /instructor/assignments[/{id}] | Tạo hoặc cập nhật bản nháp/giao bài |
| POST / PUT | /instructor/quizzes[/{id}] | Tạo hoặc cập nhật quiz |
| DELETE | /instructor/quizzes/{id} | Xóa quiz ở trạng thái Draft |
| GET / POST | /instructor/classes/{cid}/materials | Liệt kê / upload file multipart |
| GET | /instructor/classes/{cid}/materials/{id}/download | Tải bản gốc, Content-Disposition attachment |
| DELETE | /instructor/classes/{cid}/materials/{id} | Xóa tài liệu chưa được quiz tham chiếu |
| GET / POST | /admin/users | Danh sách / tạo tài khoản |
| PUT | /admin/users/{id} | Sửa tên, vai trò, trạng thái |
| GET | /admin/classes | Tất cả lớp |
| PUT | /admin/classes/{id}/instructor | Phân công `{instructorId}` |
| GET / POST | /admin/classes/{id}/members | Liệt kê / thêm `{userId}` |
| DELETE | /admin/classes/{id}/members/{uid} | Gỡ thành viên |
| GET | /admin/algorithms | Catalog và cấu hình level |
| PUT | /admin/algorithms/{id} | Lưu cấu hình bài học hiện có |
| GET | /admin/features | Danh sách cờ tính năng |
| PUT | /admin/features/{id} | Lưu `{enabled}` |
| GET / PUT | /admin/settings | Đọc/lưu `{platformName,maintenance}` |
| GET | /admin/analytics | Số lượng thực tế theo bảng, vai trò và 50 audit events gần nhất |
| GET | /admin/export | JSON hồ sơ người dùng, lớp, thống kê, cài đặt; không chứa hash mật khẩu |

Không có quyền trả 403; chưa đăng nhập trả 401; dữ liệu ngoài phạm vi Instructor trả 404; validation trả 400; vi phạm unique/key trả 409. Lỗi trả JSON có `message`.

Ví dụ tạo lớp:

```json
{"name":"Sorting SE19","description":"So sánh các thuật toán sắp xếp","topicId":"sorting","level":"basic"}
```

Assignment: `classId`, `title`, `description`, `status` (Draft hoặc Active), `due` (YYYY-MM-DD hoặc null), `lessonIds`. Giao Active cần hạn; bài học phải nằm trong chủ đề lớp và không trùng. Chỉ Draft được sửa. Không được đổi chủ đề lớp sau khi đã tạo assignment/quiz.

Quiz: `classId`, `title`, `description`, `status` (Draft hoặc Published), `due` (tùy chọn), `questions`, `materialIds`. Mỗi question gồm `id`, `prompt`, `options: [{id,text}]`, `correctOptionId`, `explanation`, `points`. Tối đa 50 câu; 2–6 lựa chọn/câu; điểm nguyên 1–20. Draft cho phép nội dung chưa hoàn chỉnh; Published yêu cầu ít nhất một câu hoàn chỉnh, lựa chọn không trùng, đáp án đúng hợp lệ. Chỉ tài liệu cùng lớp mới được gắn vào quiz. Khóa row lớp và FK bảo vệ việc kiểm tra tham chiếu khi công bố/xóa tài liệu đồng thời.

Tạo tài khoản: `email`, `name`, `role` (admin/instructor/learner), `status` (Active/Pending/Suspended), `password` (10–72 ký tự, tối đa 72 byte UTF-8). Sửa tài khoản không nhận email hoặc mật khẩu. Không có endpoint đăng ký tự chọn role. Chỉ Admin được tạo tài khoản.

Config bài học: `name`, `difficulty` (Easy/Medium/Hard), `status` (Draft/Published), `config: {timeLimit,starThresholds,hintsAllowed,prerequisites}`. Time limit 10–86400 giây, ba ngưỡng sao nguyên dương tăng dần, prerequisites là mã bài đã tồn tại.

## Schema

`app_users` dùng chung cho ba vai trò. `classrooms` tham chiếu Instructor; `enrollments` nối Learner và lớp. `assignments` lưu stable lesson IDs; `quizzes` lưu phiên bản nội dung câu hỏi trong cột text JSON; `quiz_materials` nối quiz và tài liệu. `materials` lưu metadata cùng bytea, giới hạn mỗi tệp 10 MB. `algorithms`, `feature_toggles`, `system_settings` giữ cấu hình. `audit_events` ghi ID người thao tác, hành động và thời điểm.

Không lưu điểm giả hoặc knowledge state. `quiz_attempts` lưu bài nộp do server chấm; `score` thành viên là trung bình các điểm quiz cao nhất, null khi chưa nộp quiz. Nếu cần kho file lớn, thay bytea bằng object storage và giữ kiểm tra quyền cho tải xuống. FK/index có trong migration; không dùng ORM tự sửa schema.

## Môi trường ngoài local

Đặt biến môi trường từ `.env.example`; Spring không tự đọc file `.env`. `DB_PASSWORD` là bắt buộc. Cung cấp database riêng và tài khoản database phù hợp. Seed mặc định tắt; nếu bật để bootstrap, cung cấp hai mật khẩu, sau đó tắt lại. Các mật khẩu ví dụ trong script local không dùng khi triển khai.

Ứng dụng mặc định chỉ bind `127.0.0.1:8081`; `PORT` và `SERVER_ADDRESS` có thể thay đổi. Khi deploy, phục vụ frontend và proxy `/api` qua cùng origin HTTPS, đặt `COOKIE_SECURE=true`. Nếu chạy nhiều instance, cần bổ sung session store dùng chung (ví dụ Spring Session/Redis), giới hạn đăng nhập ở gateway và kiểm thử tải. Cần cấu hình backup, mã hóa hạ tầng và storage theo môi trường triển khai. Các hạng mục này chưa được áp dụng bởi mã local này.

Script Windows dùng thư mục socket không tồn tại để JDK chọn fallback TCP loopback; workaround dành cho lỗi AF_UNIX trên máy hiện tại, không cần khi chạy Java bình thường trên môi trường khác.

Tham khảo chính thức: [Spring Security session management](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html), [CSRF cho SPA](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html), [Flyway PostgreSQL](https://documentation.red-gate.com/flyway/reference/database-driver-reference/postgresql-database).
