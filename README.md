# AlgoVenture Portal

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

## Kiểm tra

Chạy các lệnh sau từ thư mục gốc Portal:

```powershell
Push-Location ..\Backend
try { .\mvnw.cmd test } finally { Pop-Location }

Set-Location .\algoventure-admin
npm ci
npm run lint
npm test
npm run build
```

Test Portal tự đọc danh mục bài học từ repo Backend bên cạnh. Nếu clone Backend ở vị trí khác, đặt `BACKEND_CURRICULUM_PATH` thành đường dẫn tới `src/main/resources/curriculum.json` trước khi chạy `npm test`.
