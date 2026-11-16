# AlgoVenture Portal

Frontend React cho Admin và Instructor nằm trong `algoventure-admin`. Portal và Unity dùng chung REST API trong repo [AlgoVenture_Backend](../AlgoVenture_Backend/README.md). Dịch vụ AI tùy chọn nằm trong repo [AlgoVenture_AI](../AlgoVenture_AI/README.md).

## Chuẩn bị máy mới

Clone ba repo cùng cấp và giữ tên thư mục mặc định:

```text
AlgoVenture/
├── AlgoVenture_AdminUI/
├── AlgoVenture_Backend/
└── AlgoVenture_Unity/
```

- **Node.js 22.12 trở lên** và npm cho Portal. Dùng `npm ci` để cài đúng `package-lock.json`; bản Vite hiện tại cũng hỗ trợ Node 20.19.x trở lên trong nhánh 20.
- **JDK 21 đầy đủ** và **PostgreSQL 18** cho Backend. Script tự tìm công cụ qua `PATH` và các thư mục cài đặt phổ biến. Nếu không tìm được hoặc dùng vị trí tùy chỉnh, đặt `JAVA_HOME` tới JDK 21 và `POSTGRES_BIN` tới thư mục chứa `initdb.exe`, `pg_ctl.exe`, `psql.exe`, `createdb.exe`.
- Unity Hub và phiên bản Editor trong `AlgoVenture_Unity/ProjectSettings/ProjectVersion.txt`; xem [hướng dẫn Unity](../AlgoVenture_Unity/README.md).

## Chạy trên Windows

### 1. Run Backend

Mở `AlgoVenture_Backend` trong IntelliJ IDEA hoặc VS Code, chọn **JDK 21**, chờ Maven đồng bộ rồi bấm **Run `AlgoVentureApplication`**. Working directory là thư mục gốc repo Backend; repo đã có cấu hình Run cho hai IDE.

Trên Windows đã cài PostgreSQL 18, lần Run đầu tự tìm công cụ, tạo PostgreSQL phát triển riêng, sinh mật khẩu và ghi `AlgoVenture_Backend/.runtime/application-local.properties`. Bootstrap chọn cổng database từ `55433` trở lên nếu cổng mặc định bận, tạo tài khoản Portal rồi chạy API ở `8081` trong cùng lần Run. Các lần sau dùng lại cấu hình và dữ liệu đã tạo. Nếu cài PostgreSQL ở chỗ tùy chỉnh, đặt `POSTGRES_BIN` trong Run Configuration. Xem [README Backend](../AlgoVenture_Backend/README.md) cho database ngoài, macOS/Linux và cấu hình nâng cao.

Có thể chạy Backend bằng terminal thay cho IDE:

```powershell
# Chạy từ AlgoVenture_AdminUI; chuyển tiếp tới script của repo Backend.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

Hai script `start-backend.ps1` và `stop-dev-database.ps1` trong repo này chỉ chuyển tiếp tới repo Backend cùng cấp; chúng không tạo database hoặc mật khẩu riêng của Portal. Hỗ trợ `-PrepareOnly`, `-SkipBuild`, `-DatabasePort`, `-DatabaseRuntimeDirectory` theo script Backend. Nếu clone Backend ở vị trí khác:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -BackendPath 'D:\Projects\AlgoVenture_Backend'
```

Kiểm tra [API health](http://127.0.0.1:8081/api/health) trả thành công trước khi mở Portal/Unity. Chỉ chạy một Backend ở cổng 8081. Dừng Java bằng Stop trong IDE hoặc Ctrl+C. Để dừng PostgreSQL portable, chạy từ repo này:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-dev-database.ps1
```

Nếu đã dùng runtime riêng, truyền cùng `-DatabaseRuntimeDirectory` khi dừng.

### 2. Cài và chạy Portal

Mở terminal khác tại `AlgoVenture_AdminUI`:

```powershell
Set-Location .\algoventure-admin
npm ci
npm run dev
```

Mở [Portal](http://127.0.0.1:5174). Vite lấy `PORTAL_HOST`, `PORTAL_PORT`, `BACKEND_URL` và `PORT` từ `AlgoVenture_Backend/.env` hoặc `Backend/.env` ở repo cùng cấp. Mặc định `/api` được proxy tới `127.0.0.1:8081`. Giữ cùng hostname trong suốt phiên đăng nhập. Xem [cấu hình chung](../AlgoVenture_Backend/README.md#cấu-hình-chung-cho-backend-portal-và-unity).

Với setup Windows tự động khi Run hoặc qua script, tài khoản ban đầu là `admin@algoventure.edu` và `instructor@algoventure.edu`. Mở `AlgoVenture_Backend/.runtime/dev-secrets.json` trên máy của bạn để xem mật khẩu đã sinh tại khóa `adminPassword` và `instructorPassword`; `databasePassword` là mật khẩu PostgreSQL, không phải mật khẩu Portal. Nếu dùng runtime tùy chỉnh, tìm file trong thư mục runtime đó. Seed không đổi mật khẩu tài khoản đã tồn tại; sau lần khởi tạo đầu có thể đặt `app.seed.enabled=false` trong cấu hình local.

Nếu tự cấu hình Backend với database ngoài thay vì dùng script Windows, làm theo cách thiết lập thủ công trong README Backend và tự đặt mật khẩu seed (ít nhất 10 ký tự). Cấu hình ứng dụng gốc tắt seed; chỉ bật để bootstrap. Không có mật khẩu demo dùng chung và không commit file secrets.

### 3. Kết nối Unity và AI tùy chọn

Mở repo Unity bằng đúng Editor và làm theo [README Unity](../AlgoVenture_Unity/README.md), dùng API local `http://127.0.0.1:8081`. [INTEGRATION.md](INTEGRATION.md) mô tả cookie/CSRF của Portal, JWT của Unity và luồng lớp học dùng chung.

AI không bắt buộc để chạy Portal và các API cơ bản. Nếu dùng, đặt repo [AlgoVenture_AI](../AlgoVenture_AI/README.md) cùng cấp, chạy dịch vụ và đặt `AI_SERVICE_URL` trong file `.env` của Backend. Clone mới không có sẵn trọng số model đã đánh giá.

## Dữ liệu và chức năng

Backend quản lý transaction bằng Spring Data JPA/Hibernate và schema bằng Flyway. Schema V28 có **26 bảng nghiệp vụ**, cộng `flyway_schema_history`; [DATABASE.md của Backend](../AlgoVenture_Backend/DATABASE.md) là nguồn mô tả hiện hành. Frontend không đọc PostgreSQL trực tiếp. Báo cáo có ngày cũ trong [docs/erd](docs/erd/README.md) là tài liệu lịch sử.

- Portal đăng nhập bằng cookie phiên HttpOnly và CSRF; lấy lại CSRF sau đăng nhập.
- Admin quản lý tài khoản, lớp, thành viên, cấu hình bài học, feature flags, cài đặt và số liệu hệ thống.
- Instructor quản lý lớp, bộ thử thách và quiz, theo dõi kết quả và xuất CSV/JSON. Giao diện hiện không tải lên hoặc đính kèm tài liệu; API và liên kết dữ liệu cũ vẫn được giữ.
- Curriculum có 34 bài, gồm 5 bài Matrix, được đối chiếu với catalog Backend. Điểm quiz và tiến độ bài giao lấy từ API.
- Unity/Learner dùng JWT riêng, cùng nguồn tài khoản, profile, completion và log Backend. Dữ liệu khách không tự trở thành kết quả được server công nhận.

Log nằm trong `learning_attempts` và `learning_interactions`; phản hồi AI ở `adaptive_recommendations`. Có log không đồng nghĩa model đã được huấn luyện hoặc đánh giá chất lượng. Xuất CSV/JSON phục vụ báo cáo, không thay cho backup PostgreSQL.

## Kiểm tra

Từ `AlgoVenture_AdminUI/algoventure-admin`:

```powershell
npm ci
npm test
npm run lint
npm run build
```

Test curriculum ưu tiên repo `AlgoVenture_Backend` cùng cấp. Nếu checkout ở vị trí khác, đặt đường dẫn trước khi chạy:

```powershell
$env:BACKEND_CURRICULUM_PATH = 'D:\Projects\AlgoVenture_Backend\src\main\resources\curriculum.json'
npm test
```

Test Backend chạy trong repo Backend với PostgreSQL test riêng theo hướng dẫn của repo. Kiểm tra frontend ở trên không tự chứng minh cả luồng Unity–Backend–Portal đã chạy thành công.

[Swagger](http://127.0.0.1:8081/swagger-ui/index.html) và [OpenAPI](http://127.0.0.1:8081/v3/api-docs) mô tả hợp đồng HTTP hiện hành. Production cần HTTPS, reverse proxy `/api` cùng origin với Portal và SPA fallback; Vite dev proxy không nằm trong bundle production.
