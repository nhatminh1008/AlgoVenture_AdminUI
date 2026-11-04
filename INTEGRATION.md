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

Đối với Bubble Sort mức Khó, client gọi `POST /api/game/me/bubble-challenges` để nhận `{clientAttemptId,input}` gắn với tài khoản. Đề gồm 8 số khác nhau và yêu cầu ít nhất 8 lần đổi chỗ. Client gửi nhật ký qua `PUT /api/game/me/learning-attempts/{clientAttemptId}` trước khi yêu cầu ghi hoàn thành cùng mã lượt. Backend kiểm tra chủ sở hữu, khớp mảng đã cấp và phát lại thao tác. Sau khi nhận đề, lượt đang mở tiếp tục chơi được khi mất mạng và đồng bộ khi kết nối lại. Lượt bổ trợ không tính hoàn thành bài chính. Script tự giải đề được cấp vẫn có thể gửi lời giải hợp lệ.

Các bài còn lại gửi sự kiện hoàn thành do engine trình duyệt xác nhận. Backend kiểm tra danh mục, bài tiên quyết và chặng, đồng thời chống ghi trùng. Quiz Classroom chấm hoàn toàn ở server.

Chơi khách vẫn lưu cục bộ. Dữ liệu khách/local cũ không tự nhập thành kết quả server. Kết quả tài khoản lỗi mạng được xếp hàng theo userId, giữ clientAttemptId khi thử lại và hiển thị thông báo chưa đồng bộ. Sandbox không ghi điểm/hoàn thành.

## API Classroom

Game đã có màn hình Classroom dùng các API dưới đây để nhập mã lớp, xem bài giao, nộp/làm lại quiz và mở minigame được giao. Test `tests/portal-integration.spec.ts` trong repo Game kiểm tra luồng Classroom thật, điểm quiz và tiến độ minigame hiển thị trong Instructor; bật `LIVE_INTEGRATION_TEST=1` để chạy cùng backend 8081 và portal 5174.

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

Bài giao cũ có mã `stack` hoặc `queue` được mở thành ba thao tác hiện hành tương ứng. Backend chỉ ghi hoàn thành mã bài giao cũ sau khi đủ cả ba thao tác; không tạo thêm điểm hoặc hoàn thành bài chính cho mã cũ. Kết quả bài giao cũ đã có được giữ nguyên. Mỗi thao tác trên bản đồ cần vượt mức Khó để gửi hoàn thành; mức Dễ/Vừa chỉ lưu tiến trình độ khó cục bộ.

Instructor state trả điểm trung bình các điểm cao nhất của từng quiz đã nộp, số quiz đã nộp, bài thực hành hoàn thành/được giao và phần trăm. Tiến độ, phân tích và CSV/JSON dùng số liệu này. Chưa có mô hình Knowledge Tracing.

## Chạy

1. Repo AdminUI: `.\scripts\start-backend.ps1`.
2. Terminal khác, thư mục algoventure-admin: `npm run dev`.
3. Terminal khác, thư mục AlgoVenture_Game: `npm run dev`.

Swagger: http://127.0.0.1:8081/swagger-ui/index.html. API game: đăng ký/đăng nhập rồi nhập token vào Authorize → game. API portal: lấy CSRF rồi đăng nhập bằng cookie.

Backend: `backend/mvnw.cmd test`. Portal: `npm test`, `npm run lint`, `npm run build`. Game: `npm run build`; kiểm thử hợp đồng/UI bằng API giả lập: `npx playwright test tests/auth.spec.ts tests/guest.spec.ts tests/shared-backend.spec.ts`. Test live validation trong auth.spec.ts cần `LIVE_AUTH_TEST=1` và backend 8081 đang chạy. Xem thêm `../AlgoVenture_Game/INTEGRATION.md`.

Production cần HTTPS, proxy /api cùng origin, SPA fallback và biến môi trường database. Dev proxy không có trong bundle production.

Kiểm thử tích hợp thật có trong repo Game: bật backend 8081 và portal 5174, đặt `LIVE_INTEGRATION_TEST=1`, chạy `npx playwright test tests/live-integration.spec.ts`. Test tạo dữ liệu có tiền tố QA trong database phát triển. Game được Playwright chạy tại 5173 nếu chưa bật. Máy dùng Edge có thể đặt `PLAYWRIGHT_CHANNEL=msedge`.

## Cấu hình module theo bài giao

Bộ thử thách nhận `lessonConfigs` theo lesson ID. Hiện hỗ trợ `bubble`, `selection`, `insertion`, `merge`, `quick`:

```json
{"lessonConfigs":{"bubble":{"timeLimitSeconds":90,"difficulty":"easy","input":[8,3,-1,3,2]}}}
```

`timeLimitSeconds`: 30–3600 giây (mặc định 300). `difficulty`: easy/medium/hard. `input`: 2–8 số nguyên -99…99; bỏ trống để tạo đề. Chỉ cấu hình bài đã chọn; không đổi cấu hình sau khi công bố. Mỗi module mới cần khai báo các trường phù hợp với engine trước khi cho giảng viên chỉnh.

Game đọc cấu hình trong API Classroom, áp dụng đồng hồ và chuỗi của bài giao. `POST /api/game/me/bubble-challenges?assignmentId=...` cấp đề Bubble đúng cấu hình, kiểm tra thành viên và hạn nộp. Nhật ký vẫn được server phát lại và kiểm tra thời gian. Completion gửi thêm `assignmentId`; bài tùy chỉnh ghi kết quả riêng cho bài giao, không mở khóa tiến trình tự do hay tính cho bài giao khác. Những bài chưa tùy chỉnh giữ luồng hoàn thành cũ.

Migration V8 bổ sung cấu hình bài giao và liên kết đề Bubble. Cần chạy backend mới cùng game mới để sử dụng cấu hình.

## Danh mục hiện hành và bài gộp đã ngừng dùng

Danh mục hiện tại có 29 bài, khớp các ID trong `ALL_LESSONS` của game. `stack` và `queue` chỉ còn là tên nhóm hoặc dữ liệu lịch sử; không còn là bài được giao hoặc được mở. Stack dùng Push/Pop/Peek; Queue dùng Enqueue/Dequeue/Peek.

Migration V9 chuyển mọi bộ bài cũ từ `stack` sang ba thao tác Stack, `queue` sang ba thao tác Queue, loại ID trùng và cập nhật bài tiên quyết. Các dòng kết quả cũ được giữ nguyên để bảo toàn lịch sử; chúng không tự hoàn thành các thao tác mới. Catalog, API Admin, Instructor và game không cung cấp hai bài đã ngừng dùng; server từ chối giao, mở lại hoặc ghi hoàn thành chúng.

Migration V10 đồng bộ nhánh Cây với Game: `tree-basics` → `tree-dfs` → `tree-bfs` → `bst-search` → `bst-insert` → `bst-delete`. Bài `tree-traversal` cũ tách thành DFS/BFS; `bst` nền tảng đã ngừng dùng và được bỏ khỏi bài tiên quyết/bài giao. Bộ chỉ chứa `bst` được đóng vì không còn bài chơi. Bộ hỗn hợp giữ các bài còn lại. Portal dùng cùng danh mục mới.

V10 giữ các dòng hoàn thành cũ và thời điểm gốc. Người đã hoàn thành `tree-traversal` được hiển thị hoàn thành cả DFS và BFS, đúng phạm vi bài cũ; không tạo thêm điểm xếp hạng khi chuyển đổi hoặc chơi lại hai bài được kế thừa. Kết quả bài giao `tree-traversal` được chuyển sang hai ID mới và giữ bản ghi gốc. Cấu hình/trạng thái công bố bài cũ được kế thừa nếu chưa có cấu hình riêng cho bài mới; bài có cấu hình riêng được giữ nguyên. Các migration V1–V9 không bị sửa checksum.
