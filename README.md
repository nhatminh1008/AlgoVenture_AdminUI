# AlgoVenture Portal

Web chung cho Admin và Instructor dùng React cùng Java Spring Boot và PostgreSQL. Frontend chính nằm trong `algoventure-admin`, backend trong `backend`. `algoventure-instructor` là bản standalone cũ dùng dữ liệu cục bộ, giữ để tham chiếu.

## Backend chung hiện tại

Admin, Instructor và Learner dùng chung backend `backend` ở cổng 8081 và bảng `app_users`. Learner tự đăng ký trong web game, tham gia lớp bằng mã mời và nộp quiz. Hồ sơ, tiến trình game và bảng xếp hạng lấy dữ liệu server. Không cần backend game 8080. Xem [API và luồng tích hợp hiện tại](INTEGRATION.md).

## Chạy trên máy Windows hiện tại

Mở terminal tại thư mục repo và chạy backend:

```powershell
.\scripts\start-backend.ps1
```

Script dùng JDK 21 ở `JAVA_HOME` hoặc `%LOCALAPPDATA%\AlgoVenture\tools`, Maven Wrapper và PostgreSQL 18 đã cài trên máy. Database phát triển nằm riêng trong `.runtime/postgres`, lắng nghe `127.0.0.1:55432`. Script không thay đổi PostgreSQL đang chạy ở cổng mặc định. Mật khẩu database được sinh ngẫu nhiên và lưu trong `.runtime/dev-secrets.json` đã loại khỏi Git.

Mở terminal thứ hai:

```powershell
cd algoventure-admin
npm install
npm run dev -- --host 127.0.0.1
```

Mở URL Vite hiển thị, hiện tại là http://127.0.0.1:5174. Vite chuyển `/api` đến Spring Boot ở `127.0.0.1:8081`. Dùng cùng một hostname trong suốt phiên đăng nhập.

| Vai trò | Email | Mật khẩu khởi tạo cho môi trường local |
| --- | --- | --- |
| Admin | admin@algoventure.edu | Admin@12345 |
| Instructor | instructor@algoventure.edu | Instructor@12345 |

Đây là tài khoản lưu trong database, mật khẩu được băm BCrypt. Seed chỉ tạo tài khoản chưa tồn tại, không đặt lại mật khẩu khi khởi động. Có thể đặt `SEED_ADMIN_PASSWORD` và `SEED_INSTRUCTOR_PASSWORD` trước lần khởi tạo đầu tiên để dùng mật khẩu khác. Mật khẩu demo cũ trong frontend không còn dùng được. Web không còn giữ tài khoản hay phiên trong localStorage/sessionStorage.

Dừng backend bằng Ctrl+C trong terminal chạy backend. Database local tiếp tục chạy; để dừng riêng database:

```powershell
.\scripts\stop-dev-database.ps1
```

Nếu đã build và chỉ cần chạy lại backend, dùng `start-backend.ps1 -SkipBuild`.

## Chức năng đã nối API

- Đăng nhập, khôi phục phiên và đăng xuất với cookie HttpOnly và CSRF. Vai trò được kiểm tra ở server; tài khoản bị khóa hoặc đổi vai trò mất quyền ở request tiếp theo.
- Admin tạo/sửa tài khoản, đổi vai trò/trạng thái, phân công Instructor và thêm/gỡ Learner khỏi lớp. Luôn giữ ít nhất một Admin đang hoạt động.
- Instructor tạo/sửa lớp thuộc quyền mình, soạn/giao bộ thử thách, soạn và công bố trắc nghiệm. Nội dung đã công bố được giữ nguyên.
- Upload/download tài liệu PDF, DOCX, PPTX, TXT tối đa 10 MB. File và metadata lưu ở PostgreSQL; tài liệu được tham chiếu bởi quiz không được xóa.
- Admin cấu hình 25 bài học có mã ổn định, ngưỡng sao, thời gian, gợi ý và bài tiên quyết; lưu feature toggles và cài đặt nền tảng.
- Thống kê tài khoản, lớp, thành viên, tài liệu và nhật ký thao tác lấy từ database. Instructor xuất CSV/JSON theo lớp từ dữ liệu đã tải qua API.

Dữ liệu localStorage/IndexedDB cũ không tự nhập lên server. Database mới bắt đầu với catalog và hai tài khoản bootstrap, không sinh điểm hoặc sinh viên giả. Việc kiểm thử trình duyệt đã tạo một lớp có tên `Sorting — Lớp kiểm thử API`, một quiz kiểm thử và tài khoản `qa.learner@example.test` trong database phát triển.

## Phạm vi còn lại

Game đã đọc quiz/bộ thử thách và lưu sự kiện hoàn thành bài học. Điểm quiz và tiến độ bài giao hiển thị trong Instructor; mastery chưa có mô hình ước lượng. Làm thử quiz chỉ dành cho giảng viên, không ghi kết quả học viên. Các feature toggle và cờ bảo trì được lưu để client/game đọc khi tích hợp; chưa tự thay đổi hành vi game. Catalog giữ 25 mã bài hiện có, chưa tạo thêm thuật toán thực thi mới. Xuất dữ liệu portal không phải backup database đầy đủ.

Đăng ký công khai Learner và Bearer session dành cho game đã có. Google OAuth, quên/đổi mật khẩu, đồng bộ offline đầy đủ, Redis và FastAPI/Knowledge Tracing chưa được triển khai. Xác thực web hiện dùng session phía server. Chưa kiểm thử tải 2.000 người dùng hoặc cấu hình mã hóa ổ đĩa theo yêu cầu triển khai trong đặc tả.

## Kiểm tra

```powershell
cd backend
.\mvnw.cmd test
cd ..\algoventure-admin
npm test
npm run lint
npm run build
```

Backend test mặc định dùng H2, cùng migration Flyway. Có thể đặt `TEST_DB_URL`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_DRIVER=org.postgresql.Driver` để chạy với một PostgreSQL test database riêng; không trỏ test vào database đang sử dụng. Các test nghiệp vụ rollback thay đổi của từng test; runner vẫn khởi tạo catalog và tài khoản test trong database test.

Xem [API và thiết kế backend](backend/README.md) để biết endpoint, schema và cấu hình triển khai. Lint hiện có cảnh báo React Fast Refresh và state trong effect; build không có lỗi.
