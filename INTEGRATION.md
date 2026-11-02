# Backend chung cho Admin, Instructor và Learner

Backend duy nhất: `AlgoVenture_AdminUI/backend`, cổng **8081**, PostgreSQL local **55432**. Web game `AlgoVenture_Game` chạy **5173**; Admin/Instructor chạy **5174**. Cả hai Vite proxy `/api` về 8081. Không cần backend game 8080.

## Tài khoản

Tất cả tài khoản nằm trong `app_users`. Learner tự đăng ký chỉ được tạo role learner và trạng thái Active. Admin thấy tài khoản mới ngay trong quản lý người dùng. Portal giữ `/api/auth/*`, cookie HttpOnly và CSRF.

Game/Classroom dùng Bearer token do backend chung cấp: token ngẫu nhiên 256 bit, thời hạn 8 giờ, database chỉ lưu SHA-256. Đây là phiên opaque có thể thu hồi, không phải JWT. Logout thu hồi token ngay; mỗi request kiểm tra vai trò/trạng thái hiện tại. Game gửi credentials omit nên phiên cookie portal không bị thay đổi.

Tài khoản/mật khẩu trong backend 8080 trước đây không tự được chuyển sang backend chung. Các bảng/liên kết V2/V3 cũ được giữ nguyên, nhưng xác thực mới không gọi identity 8080.

## API game

| Method | Path | Nội dung |
| --- | --- | --- |
| POST | `/api/game/auth/register` | `{email,password,fullName}` → 201, tài khoản và token |
| POST | `/api/game/auth/login` | `{email,password}` → tài khoản và token |
| GET | `/api/game/auth/me` | Danh tính trong phiên |
| POST | `/api/game/auth/logout` | Thu hồi token → 204 |
| GET | `/api/game/me/state` | `{profile,completed,linkedLevels}` từ database |
| PUT | `/api/game/me/profile` | `{name,avatar,avatarImage?}`; không nhận tiến trình từ client |
| POST | `/api/game/me/completions` | `{clientAttemptId,lessonId,stage}`; chống trùng, kiểm tra bài công bố, tiên quyết và chặng |
| GET | `/api/game/curriculum` | Danh mục, trạng thái, cấu hình bài và feature flags |
| GET | `/api/game/leaderboard?period=weekly` | weekly hoặc all-time; 100 điểm/bài hoàn thành lần đầu |

Register: tên tối đa 100 ký tự, email 254, mật khẩu 6–72 ký tự và không quá 72 byte UTF-8. Tên hiển thị game tối đa 24 ký tự. Avatar JPG/PNG/WebP dạng data URL, tối đa 500.000 ký tự sau khi frontend thu nhỏ.

Response auth có userId dạng số ổn định từ learner_profiles, liên kết UUID app_users.id; role LEARNER, tokenType Bearer, expiresIn tính bằng millisecond, expiresAt là Unix epoch millisecond. Game giữ token trong sessionStorage theo tab. Tải lại/đăng nhập lấy dữ liệu chuẩn từ server.

Migration V4 thêm learner_profiles, learner_sessions, practice_events. Tiến trình dùng lesson_completions và assignment_completions có sẵn từ V2. Không đổi checksum migration cũ.

Hoàn thành màn chơi hiện do engine trình duyệt xác nhận rồi gửi sự kiện. Backend kiểm tra danh mục/tiên quyết/chặng, chống ghi trùng; chưa phát lại toàn bộ thao tác để chống giả mạo kết quả game. Quiz Classroom chấm hoàn toàn ở server. Leaderboard không nhận điểm client tự khai.

Chơi khách vẫn lưu cục bộ. Dữ liệu khách/local cũ không tự nhập thành kết quả server. Kết quả tài khoản lỗi mạng được xếp hàng theo userId, giữ clientAttemptId khi thử lại và hiển thị thông báo chưa đồng bộ. Sandbox không ghi điểm/hoàn thành.

## API Classroom

Backend đã có các API dưới đây; Game hiện chưa có màn hình Classroom để nhập mã lớp, xem bài giao hoặc nộp quiz. Kiểm thử live dùng API để tham gia lớp, sau đó chơi minigame qua UI và kiểm tra tiến độ trong portal.

Tất cả yêu cầu Bearer token Learner của backend chung:

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | `/api/learner/classes` | Lớp đã tham gia |
| POST | `/api/learner/classes/join` | `{code}` mã 8 ký tự → 201 |
| DELETE | `/api/learner/classes/{id}` | Rời lớp → 204, giữ lịch sử |
| GET | `/api/learner/classes/{id}/assignments` | Quiz Published và thử thách Active |
| GET | `/api/learner/assignments/{id}` | Nội dung bài trong lớp đã tham gia |
| POST | `/api/learner/assignments/{id}/attempts` | `{clientAttemptId,answers:[{questionId,selectedIndex}]}` → 201 |
| GET | `/api/learner/assignments/{id}/attempts` | Lịch sử quiz của chính Learner |

Đáp án/giải thích chỉ trả sau khi đã nộp quiz. Server chấm theo trọng số. Hạn nộp kết thúc sau ngày due theo Asia/Ho_Chi_Minh. Gửi lại cùng clientAttemptId không tạo thêm lượt. Không truy cập bài/lớp ngoài phạm vi thành viên.

Bộ thử thách mở bài tương ứng trong game. Hoàn thành trong thời hạn sẽ ghi tiến độ cho bài giao Active của lớp đã đăng ký; vẫn áp dụng luật mở khóa bài học.

Instructor state trả điểm trung bình các điểm cao nhất của từng quiz đã nộp, số quiz đã nộp, bài thực hành hoàn thành/được giao và phần trăm. Tiến độ, phân tích và CSV/JSON dùng số liệu này. Chưa có mô hình Knowledge Tracing.

## Chạy

1. Repo AdminUI: `.\scripts\start-backend.ps1`.
2. Terminal khác, thư mục algoventure-admin: `npm run dev`.
3. Terminal khác, thư mục AlgoVenture_Game: `npm run dev`.

Swagger: http://127.0.0.1:8081/swagger-ui/index.html. API game: đăng ký/đăng nhập rồi nhập token vào Authorize → game. API portal: lấy CSRF rồi đăng nhập bằng cookie.

Backend: `backend/mvnw.cmd test`. Portal: `npm test`, `npm run lint`, `npm run build`. Game: `npm run build`; kiểm thử hợp đồng/UI bằng API giả lập: `npx playwright test tests/auth.spec.ts tests/guest.spec.ts tests/shared-backend.spec.ts`. Test live validation trong auth.spec.ts cần `LIVE_AUTH_TEST=1` và backend 8081 đang chạy. Xem thêm `../AlgoVenture_Game/INTEGRATION.md`.

Production cần HTTPS, proxy /api cùng origin, SPA fallback và biến môi trường database. Dev proxy không có trong bundle production.

Kiểm thử tích hợp thật có trong repo Game: bật backend 8081 và portal 5174, đặt `LIVE_INTEGRATION_TEST=1`, chạy `npx playwright test tests/live-integration.spec.ts`. Test tạo dữ liệu có tiền tố QA trong database phát triển. Game được Playwright chạy tại 5173 nếu chưa bật. Máy dùng Edge có thể đặt `PLAYWRIGHT_CHANNEL=msedge`.
