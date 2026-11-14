# AlgoVenture Portal

<<<<<<< Updated upstream
Portal React cho Admin và Instructor nằm trong `algoventure-admin`. Portal và Game dùng chung Spring Boot API trong repo Backend bên cạnh, với PostgreSQL và bảng tài khoản `app_users`. Xem [hướng dẫn Backend](../Backend/README.md) và [luồng tích hợp Portal và Game](INTEGRATION.md).

## Chạy trên Windows

1. Mở repo `Backend` bằng IntelliJ và chạy `AlgoVentureApplication` theo [hướng dẫn Backend](../Backend/README.md). Kiểm tra `GET /api/health` tại `127.0.0.1:8081`.
2. Từ thư mục gốc của repo Portal, mở terminal riêng:

```powershell
Set-Location .\algoventure-admin
npm ci
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ Vite hiển thị, mặc định `http://127.0.0.1:5174`. Vite proxy `/api` tới `127.0.0.1:8081`. Dùng cùng một hostname trong suốt phiên đăng nhập.

### Chạy bằng script Portal

Từ thư mục gốc Portal, chạy `.scriptsstart-backend.ps1`. Script build và chạy Backend bên cạnh với PostgreSQL phát triển của Portal tại cổng `55432`. Nếu JAR đã được build, có thể dùng `.scriptsstart-backend.ps1 -SkipBuild`. Dừng tiến trình Java bằng Ctrl+C và dừng PostgreSQL của script bằng `.scriptsstop-dev-database.ps1`.

## Chức năng đã nối API

- Portal đăng nhập, khôi phục phiên và đăng xuất bằng cookie HttpOnly và CSRF.
- Admin quản lý tài khoản, phân công giảng viên, quản lý lớp và thành viên, cấu hình bài học, feature flags, cài đặt và xem số liệu hệ thống.
- Instructor quản lý lớp được phân công, soạn bộ thử thách và quiz, theo dõi kết quả và xuất CSV/JSON. Backend tiếp tục cung cấp API tài liệu cho dữ liệu cũ.
- Learner đăng ký trong Game, nhập mã lớp, xem bài giao, làm quiz và mở minigame. Điểm quiz và tiến độ bài giao được đồng bộ qua Backend. Làm thử quiz trong Portal dành cho giảng viên và không ghi điểm học viên.

Xem [danh mục API và cách kiểm tra](API_REPORT.md).
=======
Frontend React cho Admin và Instructor nằm trong `algoventure-admin`. Backend Spring Boot được tách thành repo cùng cấp [AlgoVenture_Backend](../AlgoVenture_Backend/README.md); AI service tùy chọn nằm trong `ai-service`.

## Kiến trúc và database hiện hành

Admin, Instructor, Unity và Learner dùng cùng REST API. Frontend không kết nối trực tiếp PostgreSQL. Backend quản lý dữ liệu và transaction bằng Spring Data JPA/Hibernate, nâng schema qua Flyway.

Schema V24 có **22 bảng nghiệp vụ**, cộng `flyway_schema_history`. [DATABASE.md của backend](../AlgoVenture_Backend/DATABASE.md) là tài liệu hiện hành về bảng và ánh xạ hợp nhất: profile game vào `app_users`, đề Bubble vào `game_challenges`, biên nhận/lịch sử vào `accepted_attempts`, kết quả vào `completion_records`. `assignment_lessons` là nguồn duy nhất cho danh sách/cấu hình bài giao; JSON API `lessonIds`/`lessonConfigs` giữ nguyên.

Log của 34 bài nằm trong `learning_attempts` và `learning_interactions`; kết quả yêu cầu AI ở `adaptive_recommendations`. Có log không đồng nghĩa đã có model được huấn luyện/kiểm định. Báo cáo trong [docs/erd](docs/erd/README.md) và [INTEGRATION.md](INTEGRATION.md) là tài liệu lịch sử, có tên bảng và hợp đồng xác thực cũ.

## Chạy local

1. Mở repo `AlgoVenture_Backend` và chạy theo [hướng dẫn backend](../AlgoVenture_Backend/README.md). API mặc định ở `127.0.0.1:8081`; database portable của backend dùng cấu hình riêng trong `.runtime/application-local.properties`.
2. Mở terminal trong repo này:

```powershell
cd algoventure-admin
npm install
npm run dev -- --host 127.0.0.1
```

Mở URL Vite hiển thị. Proxy `/api` trỏ tới `127.0.0.1:8081`; dùng cùng hostname trong suốt phiên đăng nhập. Không chạy bản backend cũ đồng thời. Các script khởi động cũ trong repo AdminUI không phải hướng dẫn cấu hình database hiện hành.

Tài khoản do backend quản lý. Seed tài khoản mặc định tắt; khi cần bootstrap, cấu hình mật khẩu seed trong môi trường backend rồi tắt lại sau khi khởi tạo. Không dùng mật khẩu demo trong tài liệu cũ làm thông tin đăng nhập mặc định.

## Luồng chính

- Portal đăng nhập bằng cookie phiên HttpOnly và CSRF. Frontend lấy lại CSRF sau đăng nhập; backend kiểm tra vai trò, trạng thái và phiên tài khoản.
- Admin quản lý tài khoản, lớp, cấu hình bài học, feature flags và cài đặt nền tảng.
- Instructor quản lý lớp thuộc quyền mình, giao bài thực hành, công bố quiz và quản lý tài liệu đính kèm.
- Danh mục có 34 bài, gồm 5 bài Matrix; ID, tên, chủ đề và thứ tự được kiểm tra đối chiếu với `curriculum.json` của backend. Các bài gộp đã ngừng dùng chỉ còn trong dữ liệu lịch sử.
- Điểm quiz, tiến độ bài giao và số liệu phân tích lấy qua API. Xuất CSV/JSON từ portal phục vụ báo cáo, không thay cho backup PostgreSQL.
- Game/Learner dùng JWT riêng; profile, completion và log có cùng nguồn dữ liệu backend. Không nhập tự động dữ liệu khách/local thành kết quả đã được server công nhận.
>>>>>>> Stashed changes

## Kiểm tra

Chạy các lệnh sau từ thư mục gốc Portal:

```powershell
<<<<<<< Updated upstream
Push-Location ..\Backend
try { .\mvnw.cmd test } finally { Pop-Location }

Set-Location .\algoventure-admin
npm ci
=======
cd algoventure-admin
npm test
>>>>>>> Stashed changes
npm run lint
npm test
npm run build
```

<<<<<<< Updated upstream
Test Portal tự đọc danh mục bài học từ repo Backend bên cạnh. Nếu clone Backend ở vị trí khác, đặt `BACKEND_CURRICULUM_PATH` thành đường dẫn tới `src/main/resources/curriculum.json` trước khi chạy `npm test`.
=======
Test curriculum đọc catalog backend từ repo cùng cấp; có thể chỉ định `BACKEND_CURRICULUM_PATH` nếu checkout ở vị trí khác. Test backend chạy trong repo backend bằng Maven và PostgreSQL test riêng, không dùng database đang sử dụng.

Swagger/OpenAPI của backend mô tả hợp đồng HTTP hiện hành. Production cần HTTPS và proxy `/api` phù hợp với origin của frontend; Vite dev proxy không nằm trong bundle production.
>>>>>>> Stashed changes
