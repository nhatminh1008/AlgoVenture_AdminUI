# Báo cáo hiện trạng Backend AlgoVenture

Tài liệu này mô tả backend dựa trên mã nguồn hiện tại trong `backend/src`, các migration Flyway và integration test. Đây là bản đồ chức năng để tiếp tục phát triển; endpoint/schema trong code là nguồn chính nếu tài liệu khác không còn đồng bộ.

## 1. Tổng quan

- **Ứng dụng:** REST API dùng Java 21, Spring Boot 3.5.16, Spring MVC, Spring Security, Spring JDBC, Bean Validation và Flyway.
- **Database đích:** PostgreSQL. Mặc định local chạy ở `127.0.0.1:55432`, database `algoventure`.
- **Port API:** `8081` theo cấu hình mặc định.
- **Tổ chức dữ liệu:** dùng chung `app_users` cho Admin, Instructor và Learner. Controller gọi `PortalStore`/`JdbcTemplate`; chưa dùng JPA/Hibernate.
- **Frontend tích hợp:** portal Admin/Instructor và game gọi chung backend. Portal dùng session cookie; game và Classroom dùng bearer token riêng.
- **Tài liệu API:** Swagger UI tại `/swagger-ui/index.html`, OpenAPI JSON tại `/v3/api-docs`.
- **Dữ liệu ban đầu:** catalog bài học và feature toggle được seed từ `curriculum.json`/`SeedData`; tài khoản mẫu chỉ tạo khi bật `SEED_ENABLED`.

Các điểm bắt đầu để đọc code:

| Thành phần | Vai trò |
|---|---|
| `src/main/java/edu/algoventure/AlgoVentureApplication.java` | Điểm khởi chạy Spring Boot |
| `SecurityConfig.java`, `ClassroomSecurity.java` | Hai cơ chế bảo vệ request |
| `AuthController.java`, `GameAuthController.java` | Đăng nhập portal và tài khoản game |
| `AdminController.java`, `InstructorController.java`, `LearnerController.java`, `GameController.java`, `LearningLogController.java` | REST API theo nhóm chức năng |
| `PortalStore.java`, `UserStore.java`, `LearnerSessions.java` | Truy cập dữ liệu, xác thực người dùng và phiên Learner |
| `PortalDtos.java`, `ApiException.java` | Kiểu request, validation và lỗi API |
| `Catalog.java`, `SeedData.java`, `curriculum.json` | Catalog bài học và dữ liệu bootstrap |
| `src/main/resources/db/migration/` | Lịch sử schema database |

## 2. Mô hình bảo mật và phiên đăng nhập

### Portal (Admin/Instructor)

- Đăng nhập tại `POST /api/auth/login` bằng email/mật khẩu; mật khẩu được xác thực qua BCrypt cost 12.
- Session lưu phía server. Browser nhận cookie `JSESSIONID` HttpOnly, SameSite=Lax, thời gian không hoạt động mặc định 8 giờ; cookie Secure có thể bật bằng `COOKIE_SECURE`.
- Request thay đổi dữ liệu được bảo vệ bằng CSRF cookie `XSRF-TOKEN` và header `X-XSRF-TOKEN`. Cần lấy token qua `GET /api/auth/csrf`; login/logout làm xoay token.
- `SecurityConfig` giới hạn `/api/admin/**` cho ADMIN, `/api/instructor/**` cho INSTRUCTOR; API còn lại cần đăng nhập.
- Filter kiểm tra lại trạng thái Active và role hiện hành trên mỗi request đã xác thực. Tài khoản bị khóa hoặc đổi vai trò sẽ mất phiên/quyền hiện tại.
- Tài khoản portal được tạo bởi Admin hoặc SeedData; không có API tự đăng ký để chọn role.

### Game và Classroom (Learner)

- `POST /api/game/auth/register` chỉ tạo role `learner`, trạng thái Active; client không thể chọn role hoặc trạng thái.
- Game login/register cấp bearer token ngẫu nhiên 256 bit, hết hạn sau 8 giờ. Database chỉ lưu SHA-256 của token trong `learner_sessions`; logout xóa token và có thể thu hồi ngay.
- `ClassroomSecurity` áp dụng cho `/api/game/**` và `/api/learner/**`: stateless, không dùng session/cookie portal và không yêu cầu CSRF; request cần `Authorization: Bearer ...`, ngoại trừ register/login.
- Mỗi request xác minh token, role Learner và trạng thái tài khoản hiện hành. Learner chỉ đọc/sửa dữ liệu của chính mình; Classroom API yêu cầu đang tham gia lớp.
- Portal session và game bearer token độc lập. Việc khởi động lại backend làm mất các session portal đang giữ trong bộ nhớ; bearer token game được quản lý trong database cho tới khi hết hạn hoặc logout.

### Quy ước phản hồi lỗi

- `401`: chưa đăng nhập/phiên hết hạn.
- `403`: đã xác thực nhưng role/trạng thái không đủ quyền.
- `404`: không tìm thấy tài nguyên hoặc tài nguyên nằm ngoài phạm vi truy cập.
- `400`: request/validation/quy tắc nghiệp vụ không hợp lệ.
- `409`: dữ liệu trùng hoặc vi phạm ràng buộc database.
- `413`: file vượt giới hạn upload.
- Phần lớn lỗi API trả JSON có trường `message`; lỗi validation có thêm `errors`.

## 3. Chức năng theo nhóm API

Tất cả đường dẫn dưới đây có tiền tố `/api`.

### 3.1 API chung và xác thực portal

| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Liveness đơn giản, trả trạng thái `UP` |
| GET | `/auth/csrf` | Cấp/đọc CSRF token cho web portal |
| POST | `/auth/login` | Đăng nhập portal; trả thông tin tài khoản và cookie session |
| GET | `/auth/me` | Lấy tài khoản trong session hiện tại |
| POST | `/auth/logout` | Hủy session và xóa cookie; trả 204 |

Thông tin trả về của `UserStore.Account` không chứa password/hash. Email được chuẩn hóa lowercase khi xác thực/tạo tài khoản.

### 3.2 Admin

Các route `/admin/**` chỉ dành cho ADMIN.

| Method | Path | Mô tả |
|---|---|---|
| GET / POST | `/admin/users` | Liệt kê / tạo tài khoản. Khi tạo nhận email, tên, role, trạng thái và mật khẩu; mật khẩu được băm trước khi lưu |
| PUT | `/admin/users/{id}` | Cập nhật tên, role, trạng thái; không đổi email/mật khẩu tại endpoint này |
| GET | `/admin/classes` | Liệt kê tất cả lớp |
| PUT | `/admin/classes/{id}/instructor` | Chuyển lớp cho Instructor đang Active |
| GET / POST | `/admin/classes/{id}/members` | Xem / thêm Learner Active vào lớp |
| DELETE | `/admin/classes/{id}/members/{uid}` | Gỡ Learner khỏi lớp |
| GET / PUT | `/admin/algorithms`, `/admin/algorithms/{id}` | Đọc / cấu hình bài học: tên, độ khó, Draft/Published, thời gian, ngưỡng sao, gợi ý, prerequisites |
| GET / PUT | `/admin/features`, `/admin/features/{id}` | Đọc / bật tắt feature toggle |
| GET / PUT | `/admin/settings` | Đọc / lưu tên nền tảng và cờ maintenance |
| GET | `/admin/analytics` | Thống kê số lượng bảng, phân bố role, 50 audit event gần nhất |
| GET | `/admin/export` | Xuất JSON users, classes, analytics và settings; không phải bản backup database |

Các ràng buộc đáng chú ý:

- Không thể hạ role/trạng thái của Admin Active cuối cùng. Các Admin được khóa theo thứ tự ổn định trước khi kiểm tra để tránh hai cập nhật đồng thời cùng vô hiệu hóa Admin cuối.
- Không thể chuyển role khỏi Instructor nếu Instructor còn sở hữu lớp; không thể chuyển role khỏi Learner nếu còn enrollment. Cần chuyển lớp/gỡ enrollment trước.
- Admin chỉ gán lớp cho Instructor Active và chỉ thêm Learner Active.
- Algorithm config kiểm tra ba ngưỡng sao tăng dần, prerequisites phải tồn tại, không trùng và không tự tham chiếu.
- Feature flags/settings hiện được lưu và trả về API; việc chúng điều khiển hành vi game/portal cần được tích hợp ở client riêng.

### 3.3 Instructor

Các route `/instructor/**` chỉ dành cho INSTRUCTOR. Các thao tác nghiệp vụ được giới hạn vào lớp thuộc Instructor đang đăng nhập; truy cập ngoài phạm vi trả 404.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/instructor/state` | Tập hợp lớp, assignment, quiz, Learner và số liệu tiến độ thuộc Instructor |
| GET | `/instructor/curriculum` | Danh mục topic/lesson |
| POST / PUT | `/instructor/classes[/{id}]` | Tạo / sửa lớp; lớp có mã mời 8 ký tự |
| POST / PUT | `/instructor/assignments[/{id}]` | Tạo / sửa assignment |
| POST / PUT | `/instructor/quizzes[/{id}]` | Tạo / sửa quiz |
| DELETE | `/instructor/quizzes/{id}` | Xóa quiz Draft; quiz đã Published không xóa được |
| GET / POST | `/instructor/classes/{cid}/materials` | Liệt kê / upload tài liệu lớp |
| GET | `/instructor/classes/{cid}/materials/{id}/download` | Tải file đính kèm |
| DELETE | `/instructor/classes/{cid}/materials/{id}` | Xóa tài liệu chưa được quiz tham chiếu |

**Classroom**

- Tên lớp duy nhất theo từng Instructor, so sánh theo `name_key` lowercase.
- Topic phải thuộc catalog. Không thể đổi topic nếu lớp đã có assignment hoặc quiz.
- Mã mời hiện tạo từ 8 ký tự đầu của UUID lớp, viết hoa; unique ở database.

**Assignment/thử thách**

- Payload có class, tiêu đề, mô tả, trạng thái Draft/Active, ngày due và danh sách `lessonIds`.
- Lesson phải thuộc topic của lớp, không được lặp; danh sách tối đa 25.
- Trạng thái Active bắt buộc có ngày due. Backend hiện không cho lưu trạng thái Closed từ endpoint này.
- Chỉ Draft được sửa. Assignment đang Active được game/Classroom đọc và dùng để đối chiếu hoàn thành bài.

**Quiz**

- Câu hỏi và nội dung được lưu dưới dạng JSON trong cột `questions`.
- Tối đa 50 câu, 2–6 lựa chọn/câu, điểm mỗi câu từ 1 đến 20.
- ID câu hỏi/lựa chọn không được lặp; khi Published, prompt/đáp án bắt buộc có nội dung và lựa chọn không rỗng/trùng.
- Tài liệu gắn với quiz phải thuộc cùng lớp; một tài liệu đang được quiz tham chiếu không thể xóa.
- Chỉ Draft được sửa hoặc xóa. Sau khi Published, nội dung được giữ nguyên để không làm thay đổi đề đã giao.
- Backend khóa row classroom khi thao tác liên quan, nhằm tuần tự hóa các thay đổi quiz/material trong lớp.

**Tài liệu**

- Chấp nhận PDF, DOCX, PPTX, TXT; tối đa 10 MiB/file. Multipart request tối đa 11 MB theo cấu hình.
- File bytes và metadata cùng nằm trong PostgreSQL (`materials.content` kiểu BYTEA); không dùng object storage.
- Download trả attachment và `X-Content-Type-Options: nosniff`.

**Số liệu Instructor**

- `score`: trung bình điểm cao nhất của từng quiz đã nộp trong lớp.
- `quizzesSubmitted`: số quiz có lượt nộp.
- `completedLessons`/`assignedLessons`: số lesson completion / tổng lesson của assignment Active.
- `progressPercent`: tỷ lệ hoàn thành, null khi không có lesson được giao.
- Instructor state và export portal dùng dữ liệu database; không có mô hình mastery/Knowledge Tracing.

### 3.4 Learner/Classroom

Các API này dùng bearer token game. Không dùng portal cookie.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/learner/classes` | Danh sách lớp Learner đã tham gia |
| POST | `/learner/classes/join` | Tham gia lớp bằng mã mời chữ/số 8 ký tự |
| DELETE | `/learner/classes/{cid}` | Rời lớp; kết quả/nộp bài cũ vẫn còn trong database |
| GET | `/learner/classes/{cid}/assignments` | Quiz Published và assignment Active của lớp |
| GET | `/learner/assignments/{id}` | Nội dung bài thuộc lớp mà Learner đang tham gia |
| POST | `/learner/assignments/{id}/attempts` | Nộp đáp án quiz; backend chấm điểm |
| GET | `/learner/assignments/{id}/attempts` | Lịch sử quiz của Learner hiện tại |

Quiz:

- Trước khi nộp, API không trả correct index/giải thích. Sau khi Learner đã có lượt nộp quiz, nội dung trả về có thể kèm đáp án/giải thích.
- Server đối chiếu question ID và selected index, tính điểm theo trọng số `points`, trả score phần trăm và số câu đúng.
- Thiếu câu trả lời được tính là không đúng; câu trả lời không thuộc quiz hoặc bị lặp sẽ bị từ chối.
- `clientAttemptId` unique theo user để retry an toàn. Cùng mã và cùng quiz trả lại kết quả cũ; dùng lại mã cho quiz khác bị từ chối.
- Hạn `due` được hiểu hết ngày theo múi giờ `Asia/Ho_Chi_Minh`; không nhận lượt mới sau thời điểm đó.
- Truy cập assignment/quiz chỉ được phép khi Learner đang tham gia lớp tương ứng. Rời lớp chặn truy cập tiếp nhưng không xóa attempt lịch sử.

### 3.5 Game: tài khoản, hồ sơ, curriculum, tiến trình

| Method | Path | Mô tả |
|---|---|---|
| POST | `/game/auth/register` | Tự đăng ký Learner; tạo profile/session và trả bearer token |
| POST | `/game/auth/login` | Đăng nhập bằng tài khoản Learner chung |
| GET | `/game/auth/me` | Danh tính của bearer session |
| POST | `/game/auth/logout` | Thu hồi bearer token; trả 204 |
| GET | `/game/me/state` | Hồ sơ, gần đây nhất 50 practice event, ngày học, lesson đã hoàn thành và linked-list stages |
| PUT | `/game/me/profile` | Sửa tên hiển thị (tối đa 24), avatar fox/buta và ảnh data URL JPG/PNG/WebP (tối đa 500.000 ký tự) |
| POST | `/game/me/completions` | Ghi completion theo clientAttemptId, lessonId, stage |
| GET | `/game/curriculum` | Topic/lesson, trạng thái bài, config, feature flags |
| GET | `/game/leaderboard?period=weekly\|all-time` | Bảng xếp hạng theo completion, tối đa 100 entries |

Tiến trình:

- Completion chỉ được ghi cho lesson đang Published; `clientAttemptId` bảo đảm retry idempotent và không được tái sử dụng cho bài/chặng khác.
- Backend kiểm tra prerequisites và thứ tự chặng `linked-list` (stage 1 trước stage 2; tối đa 2 chặng được API cho phép).
- Khi completion khớp lesson trong assignment Active của lớp đã tham gia và còn hạn, backend ghi `assignment_completions`.
- Completion cho leaderboard là lần hoàn thành lesson đầu tiên; linked-list chỉ đủ điều kiện khi hoàn tất cả hai stage. Điểm hiện tại là 100 điểm cho mỗi lesson lần đầu; weekly tính từ đầu tuần tại `Asia/Ho_Chi_Minh`.
- **Giới hạn tin cậy:** game completion endpoint nhận xác nhận hoàn thành từ client và kiểm tra lesson/prerequisite/stage, nhưng không replay toàn bộ thao tác gameplay để chứng minh kết quả. Đây không phải hệ thống anti-cheat đầy đủ.

### 3.6 Bubble Sort interaction log

| Method | Path | Mô tả |
|---|---|---|
| PUT | `/game/me/learning-attempts/{uuid}` | Tạo hoặc nối thêm snapshot sự kiện của một lượt Bubble Sort |
| GET | `/game/me/learning-attempts/{uuid}` | Đọc metadata, trạng thái, raw event và evaluation của chính Learner |
| GET | `/game/me/learning-attempts/{uuid}/observations` | Trả các quan sát phản hồi đầu tiên theo từng cơ hội đổi chỗ |

Đặc tả được hỗ trợ hiện tại:

- Payload yêu cầu `schemaVersion=1`, `engineVersion=bubble-v1`, `lessonId=bubble`, `mode=play`, độ khó easy/medium/hard, mảng đầu vào 2–8 số trong khoảng -99..99, timestamp và tối đa 2.000 event.
- Nguồn `classroom` phải kèm assignment ID; lần tạo lượt sẽ kiểm tra Learner tham gia lớp và assignment Active có giao bài `bubble`. Nguồn `map` không cần assignment.
- `BubbleTrace` replay Bubble Sort độc lập với UI/rendering. Mỗi move phải có trạng thái `before` khớp replay, và chỉ được di chuyển item đến vị trí kề nhau. Backend chấm đúng/sai, lưu cả lần thử sai và trạng thái sau thao tác.
- Chuỗi event phải liên tục theo sequence, event ID không lặp, elapsed không giảm; không thể sửa metadata hoặc event đã nhận. Retry prefix cũ có thể acknowledge nhưng không làm lùi tail đã lưu.
- Có event lifecycle pause/resume/completed/abandoned/timed_out; backend kiểm tra các điều kiện kết thúc (ví dụ completed chỉ hợp lệ khi thuật toán kết thúc).
- Chỉ phản hồi đầu tiên của mỗi cơ hội đổi chỗ được đưa vào observations; retry vẫn lưu trong raw log. Tự động bỏ qua các phần tử đã có thứ tự không được tính là câu trả lời của Learner.
- `observations` hiện trả `modelStatus=checkpoint_not_configured`, `mastery=null`; chưa chạy SAKT/Knowledge Tracing, chưa có pipeline huấn luyện hoặc diễn giải mastery.

## 4. Database và migration

Flyway chạy tự động. Không sửa nội dung migration đã chạy ở môi trường có dữ liệu; thêm migration mới `V6__...sql` cho thay đổi schema.

| Migration | Nội dung chính |
|---|---|
| `V1__portal.sql` | User chung; classrooms, enrollments, assignments, materials, quizzes, quiz_materials; algorithms, feature_toggles, system_settings, audit_events; index cơ bản |
| `V2__learner_integration.sql` | Mã mời lớp; quiz_attempts; lesson_completions; assignment_completions |
| `V3__classroom_game_identity.sql` | Bảng `game_classroom_accounts` liên kết ID game cũ với portal user; là cấu trúc tích hợp lịch sử, không phải cơ chế đăng nhập hiện tại |
| `V4__shared_game_backend.sql` | learner_profiles, learner_sessions, practice_events |
| `V5__bubble_interaction_logs.sql` | learning_attempts và learning_interactions, khóa/index chống trùng và liên kết event theo lượt |

Các bảng quan trọng:

- `app_users`: ID UUID dạng chuỗi, email unique, password hash, role/status có CHECK constraint.
- `classrooms`: Instructor owner, topic/level, invite code; unique `(instructor_id, name_key)`.
- `enrollments`: quan hệ learner-class, unique `(class_id,user_id)`.
- `assignments`: lesson IDs được lưu JSON text.
- `quizzes`: questions lưu JSON text; `quiz_materials` nối quiz với tài liệu.
- `materials`: metadata và nội dung file BYTEA.
- `algorithms`: catalog + cấu hình JSON; `feature_toggles`, `system_settings` lưu cài đặt runtime.
- `audit_events`: actor/action/thời gian; analytics đọc 50 sự kiện gần nhất.
- `quiz_attempts`: kết quả quiz JSON và score; unique `(user_id,client_id)`.
- `lesson_completions`, `assignment_completions`, `practice_events`: tiến trình game và tiến độ theo bài giao.
- `learner_profiles`: game ID số ổn định, display name, avatar.
- `learner_sessions`: SHA-256 token, user ID và expires_at.
- `learning_attempts`, `learning_interactions`: metadata, trạng thái, raw event và kết quả replay/evaluation.

## 5. Catalog và seed

- `curriculum.json` định nghĩa 4 topic và 25 lesson ID ổn định: Sorting (5), Searching (2), Data Structures (14), Graphs/Pathfinding (4).
- `Catalog` dùng file này để kiểm tra topic/lesson khi tạo lớp và assignment.
- Khi khởi động, `SeedData` thêm lesson còn thiếu vào `algorithms` và thêm các feature flag mặc định nếu chưa có; thao tác này không tạo điểm hay learner giả.
- Tài khoản bootstrap được tạo khi `SEED_ENABLED=true`; seed không ghi đè tài khoản đã tồn tại và không reset mật khẩu khi khởi động lại.
- Thay đổi lesson ID có ảnh hưởng tới FK, assignment và progress; cần kế hoạch migrate dữ liệu, không chỉ đổi JSON.

## 6. Cấu hình và chạy

Biến môi trường được đọc trong `application.properties`:

| Biến | Mặc định/ý nghĩa |
|---|---|
| `SERVER_ADDRESS` | `127.0.0.1` |
| `PORT` | `8081` |
| `DB_URL` | `jdbc:postgresql://127.0.0.1:55432/algoventure` |
| `DB_USER`, `DB_PASSWORD` | Thông tin kết nối database |
| `COOKIE_SECURE` | `false` local; bật khi chạy qua HTTPS |
| `SEED_ENABLED` | `false`; bật để tạo tài khoản bootstrap |
| `SEED_ADMIN_PASSWORD`, `SEED_INSTRUCTOR_PASSWORD` | Mật khẩu seed; tối thiểu 10 ký tự |
| `SPRINGDOC_API_DOCS_ENABLED`, `SPRINGDOC_SWAGGER_UI_ENABLED` | Có thể tắt tài liệu API trên môi trường triển khai |
| `TEST_DB_URL`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_DRIVER` | Override database test; mặc định H2 PostgreSQL mode |

Chạy backend trong PowerShell từ thư mục repository:

```powershell
.\scripts\start-backend.ps1
```

Chạy test từ `backend`:

```powershell
.\mvnw.cmd test
```

Test mặc định dùng H2 trong PostgreSQL compatibility mode và chạy cùng migration Flyway. Nếu thay bằng PostgreSQL, phải dùng database test riêng, không dùng database đang phục vụ local/dev.

## 7. Kiểm thử hiện có

Integration test dùng Spring Boot Test + MockMvc, `@ActiveProfiles("test")` và rollback transaction theo test.

- `PortalIntegrationTest`: Swagger/OpenAPI, cookie + CSRF, login/logout, role authorization, ownership lớp, validation, publish immutability, material upload/download, quiz validation, quản lý user/enrollment, bảo vệ Admin cuối, config bài học.
- `LearnerIntegrationTest`: tham gia/rời lớp, giới hạn quyền theo enrollment, chấm quiz, idempotency và tách biệt quiz progress với game progress.
- `SharedGameIntegrationTest`: tự đăng ký Learner vào shared account, bearer session hashed/revocable, role/status hiện hành, profile/progress, prerequisites/stage và leaderboard.
- `BubbleInteractionIntegrationTest`: replay/chấm đúng sai, raw log/observations, idempotent prefix, chống sửa metadata/event, sequence gap, completion giả, lifecycle và cô lập dữ liệu theo owner.

Chạy toàn bộ backend test bằng `.\mvnw.cmd test`. Test class hoặc method cũng có thể chạy bằng tham số Surefire `-Dtest=PortalIntegrationTest`, `-Dtest=LearnerIntegrationTest`, `-Dtest=SharedGameIntegrationTest` hoặc `-Dtest=BubbleInteractionIntegrationTest`.

## 8. Giới hạn hiện tại cần biết trước khi mở rộng

1. **Chưa có tầng service/domain tách rõ:** một số quy tắc và truy vấn nằm trong controller/store, SQL viết trực tiếp bằng `JdbcTemplate`. Khi thêm nghiệp vụ, cần đặt transaction và ownership guard ở đúng lớp, tránh để controller khác bypass quy tắc.
2. **Schema JSON dạng text:** assignment lesson list, quiz questions, config và log metadata/evaluation lưu dạng text JSON. Đây là cách hiện tại; thay đổi cấu trúc phải giữ tương thích payload cũ và cân nhắc versioning/indexing.
3. **Upload lưu trong DB:** phù hợp quy mô hiện tại nhưng làm database backup/phình dung lượng; chưa có object storage/quota/retention pipeline.
4. **Chấm điểm gameplay:** completion tổng quát dựa vào xác nhận client; chỉ Bubble Sort interaction log được server replay chi tiết. Các thuật toán khác chưa có event replay chống giả mạo.
5. **Bubble interaction analytics:** có raw log và first-response observations, nhưng chưa có model checkpoint, mastery score, ingestion/training pipeline hoặc dashboard.
6. **Feature flags/maintenance:** backend có thể lưu và cung cấp trạng thái; chưa tự động áp dụng chính sách maintenance hay đảm bảo tất cả client phản ứng với từng flag.
7. **Tài khoản và khôi phục:** chưa thấy luồng quên/đổi mật khẩu, xác minh email hoặc Google OAuth trong backend hiện tại.
8. **Quan sát hệ thống:** audit đang ghi action tổng quát; chưa phải audit trail chi tiết mọi thay đổi trước/sau, chưa có metrics/tracing/rate limiting trong phần backend đã khảo sát.
9. **Xuất dữ liệu:** `/admin/export` là JSON tiện dụng cho portal, không chứa toàn bộ dữ liệu nhạy cảm/binary và không thay thế backup/restore.
10. **Khả năng scale:** session portal dùng session store mặc định phía ứng dụng; chưa cấu hình Redis/shared session hoặc kiểm thử tải lớn trong backend này.

## 9. Gợi ý thứ tự phát triển tiếp

1. **Xác định yêu cầu và hợp đồng API:** cập nhật DTO, endpoint, ownership/role, response/error shape và OpenAPI trước khi sửa code; kiểm tra tác động với cả portal/game.
2. **Bổ sung migration mới:** tạo `V6__...sql`; dùng FK/unique/check/index cho quy tắc cần bảo vệ đồng thời. Không sửa V1–V5 đã chạy.
3. **Implement nghiệp vụ tại nơi dùng chung:** đặt validation nghiệp vụ và transaction trong service/store dùng chung; controller giữ phần HTTP/mapping. Duy trì câu SQL có tham số và kiểm tra owner ở mọi đường truy cập.
4. **Viết integration test theo luồng:** kiểm tra trường hợp thành công, invalid input, quyền/tenant isolation, duplicate/retry, deadline và hai request cạnh tranh nếu có liên quan.
5. **Đồng bộ client và tài liệu:** cập nhật consumer API, `INTEGRATION.md`/README khi hợp đồng thay đổi; nếu thêm game events cần version schema và xử lý backward compatibility.
6. **Chạy xác minh:** `.\mvnw.cmd test`; với thay đổi cross-client, chạy thêm kiểm tra frontend hoặc live integration phù hợp.

### Những hướng mở rộng cụ thể

- Thêm mô hình mastery: xác định KC/định nghĩa observation, version schema sự kiện, pipeline chất lượng dữ liệu và kiểm thử với dữ liệu tổng hợp trước khi trả mastery cho client.
- Mở rộng replay cho game: thiết kế event hợp đồng theo từng algorithm, validate trạng thái đầu/cuối ở server và chỉ ghi completion sau khi server xác nhận.
- Thêm quản lý file quy mô lớn: storage ngoài database, giới hạn theo lớp/user, checksum, retention và cơ chế tải có kiểm soát.
- Tăng độ an toàn tài khoản: reset password có token một lần, xác minh email, chính sách rate limit và audit sự kiện xác thực.
- Bổ sung khả năng vận hành: metrics, health/readiness database, structured logging, audit diff, backup/restore và chiến lược session dùng chung khi chạy nhiều instance.
- Tạo migration cho export/backup chính thức nếu cần phục hồi; cần định nghĩa rõ dữ liệu cá nhân, binary, attempt, audit và retention.

## 10. Các tài liệu nên đọc cùng report

- [README backend](README.md): cách chạy và mô tả ngắn các endpoint.
- [INTEGRATION.md](../INTEGRATION.md): hợp đồng tích hợp portal/game và luồng Classroom.
- `src/main/resources/db/migration/`: nguồn schema theo phiên bản.
- `src/test/java/edu/algoventure/`: ví dụ request, expected response và các invariant đã được kiểm thử.
