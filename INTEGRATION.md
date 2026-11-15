# Tích hợp Portal, Backend và Unity

Ba repo hiện hành là `AlgoVenture_AdminUI`, `AlgoVenture_Backend` và `AlgoVenture_Unity`, đặt cùng cấp. Dùng [README Portal](README.md), [README Backend](../AlgoVenture_Backend/README.md) và [README Unity](../AlgoVenture_Unity/README.md) để chuẩn bị máy mới. Backend sở hữu database và cấu hình local; script trong AdminUI chỉ chuyển tiếp tới Backend.

| Thành phần | Địa chỉ local | Vai trò |
| --- | --- | --- |
| Portal Vite | `http://127.0.0.1:5174` | Admin/Instructor; proxy `/api` tới Backend |
| Backend | `http://127.0.0.1:8081` | REST API dùng chung |
| PostgreSQL portable | `127.0.0.1:55433/algoventure` mặc định | Bootstrap mới tự chọn cổng trống nếu bận; xem cấu hình local |
| Unity Editor/player | API `http://127.0.0.1:8081` | Client Learner; cấu hình theo README Unity |
| AI tùy chọn | Theo `AI_SERVICE_URL` | HTTP nội bộ từ Backend tới AI service |

Cấu hình máy được sinh trong `AlgoVenture_Backend/.runtime`, không commit vào Git. Trên Windows đã cài JDK 21 và PostgreSQL 18, mở repo Backend trong IDE và Run `AlgoVentureApplication`: lần đầu tự tạo cấu hình/database, chạy migration và khởi động API. Các lần sau dùng lại dữ liệu đã tạo. Xem README Backend cho database ngoài và macOS/Linux. Không chạy hai bản Backend cùng cổng API. Với thiết bị ngoài máy phát triển, loopback trỏ vào chính thiết bị; cấu hình địa chỉ Backend phù hợp theo hướng dẫn Unity.

## Xác thực và tài khoản

Tất cả tài khoản nằm trong `app_users`. Portal dùng cookie phiên HttpOnly và CSRF:

1. `GET /api/auth/csrf` lấy `headerName` và `token`, giữ cookie trả về.
2. `POST /api/auth/login` với `{email,password}`, cookie và header CSRF.
3. Lấy lại CSRF sau đăng nhập; gửi cookie và CSRF mới cho các thao tác ghi.
4. `GET /api/auth/me` kiểm tra phiên; `POST /api/auth/logout` đăng xuất.

Unity/Learner dùng `POST /api/game/auth/login`, sau đó gửi `Authorization: Bearer <token>` cho `/api/game/**` và `/api/learner/**`. Token được quản lý riêng với cookie Portal. Backend kiểm tra vai trò, trạng thái tài khoản và `auth_version`; token/phiên cũ bị thu hồi theo quy tắc thay đổi tài khoản.

Portal và Unity desktop hỗ trợ **Đăng nhập bằng Google**. Email đã có tài khoản dùng lại quyền và hồ sơ. Email mới đi qua bước hoàn thiện hồ sơ để tạo Learner. Người dùng cũng có thể đăng nhập bằng username và mật khẩu. Xem [cấu hình OAuth trong README Backend](../AlgoVenture_Backend/README.md#đăng-nhập-bằng-google).

Sau khi đăng nhập, người dùng có thể đổi mật khẩu trong hồ sơ. Quên mật khẩu và đăng ký email cần cấu hình SMTP/OTP theo README Backend. API đăng ký cũ `/api/game/auth/register` có thể bị khóa khi bật xác thực email; không giả định endpoint này luôn mở. Setup Windows mới bật seed và sinh mật khẩu Portal tại `AlgoVenture_Backend/.runtime/dev-secrets.json`, khóa `adminPassword`/`instructorPassword`; `databasePassword` chỉ dành cho PostgreSQL. Cách thiết lập thủ công dùng mật khẩu do người chạy chọn. Seed không đổi tài khoản đã tồn tại và có thể tắt sau bootstrap.

## Luồng lớp học dùng chung

1. Admin tạo/phân công lớp hoặc Instructor tạo lớp của mình qua Portal.
2. Instructor tạo bộ thử thách, chọn bài từ curriculum Backend, đặt hạn và chuyển sang `Active`; quiz dùng trạng thái `Published`.
3. Learner đăng nhập Unity và gọi `POST /api/learner/classes/join` với `{code}` là mã lớp 8 ký tự.
4. `GET /api/learner/classes/{id}/assignments` trả các bài đã công bố trong lớp; `GET /api/learner/assignments/{id}` lấy nội dung.
5. Quiz gửi `{clientAttemptId,answers:[{questionId,selectedIndex}]}` tới `POST /api/learner/assignments/{id}/attempts`; Backend chấm điểm.
6. Minigame dùng đề, nhật ký và API completion phù hợp bài học; gửi `assignmentId` khi làm bài giao. Instructor đọc lại `/api/instructor/state` để xem kết quả và tiến độ, `/api/instructor/classes/{id}/practice` để xem evidence của lớp.

API chỉ cho phép truy cập lớp/bài trong phạm vi được cấp quyền. Gửi lại cùng mã lượt không được nhân đôi kết quả. Việc lưu log không tự công nhận hoàn thành; dữ liệu khách/local không tự nhập thành kết quả server.

## Bài học, completion và AI

Curriculum có 34 bài, gồm 5 bài Matrix. Portal kiểm tra catalog bằng `npm test`, Instructor tải catalog từ `/api/instructor/curriculum`. Các ID gộp `stack`, `queue`, `tree-traversal`, `bst` đã ngừng dùng làm bài hiện hành.

`GET /api/game/me/state` trả hồ sơ và tiến độ chuẩn từ server. Bài học có thể phụ thuộc trạng thái công bố, tiên quyết, feature flags và cờ bảo trì. Các API cấp đề nằm trong [OpenAPI Backend](http://127.0.0.1:8081/v3/api-docs).

Bubble dùng `PUT /api/game/me/learning-attempts/{attemptId}`; log các bài còn lại dùng cùng đường dẫn với `?format=gameplay-v1`. Backend phát lại thao tác và giữ nguồn gốc trạng thái đầu; `clientOutcome` không thay thế đánh giá server. Completion dùng `POST /api/game/me/completions`, có `clientAttemptId`, `lessonId`, `stage` và các trường theo hợp đồng bài học, gồm `assignmentId`/`actions` khi cần.

Bộ thử thách hỗ trợ `lessonConfigs` cho `bubble`, `selection`, `insertion`, `merge`, `quick`:

```json
{"lessonConfigs":{"bubble":{"timeLimitSeconds":90,"difficulty":"easy","input":[8,3,-1,3,2]}}}
```

`timeLimitSeconds`: 30–3600; `difficulty`: easy/medium/hard; `input`: 2–8 số nguyên từ -99 đến 99. Chỉ cấu hình bài đã chọn; nội dung công bố được giữ cố định. Bài tùy chỉnh dùng phạm vi assignment riêng.

Schema hiện hành là V33, gồm 27 bảng nghiệp vụ. Xem [DATABASE.md](../AlgoVenture_Backend/DATABASE.md) để đối chiếu migration và cấu trúc các bảng.

AI là dịch vụ tùy chọn. Khi chưa có model phù hợp, hệ thống trả trạng thái chưa sẵn sàng; log hoặc fixture kiểm thử không chứng minh chất lượng mô hình. Xem [AI README](ai-service/README.md) cho môi trường Python, manifest và giới hạn hiện tại.

## Kiểm tra tích hợp

Chạy frontend `npm ci`, `npm test`, `npm run lint`, `npm run build`; chạy Backend và Unity tests theo README riêng, dùng database test tách biệt. Kiểm tra thật trên môi trường test cần theo hết luồng tạo lớp → giao bài → learner tham gia/làm bài → Instructor đọc kết quả, kèm thay đổi cấu hình Admin → Unity đồng bộ. Test frontend giả lập HTTP hoặc build thành công chưa đủ xác nhận luồng này.

[Swagger](http://127.0.0.1:8081/swagger-ui/index.html) hỗ trợ thử API sau khi Backend chạy. Production cần HTTPS, reverse proxy `/api` cùng origin với Portal và SPA fallback. Dev proxy không có trong bundle production.
