# Redis — tích hợp ADMIN_UI

Cập nhật 20/11/2026. Đã hợp nhất bản Redis từ dev vào main bằng fast-forward, không có conflict Portal. Source nền là main e2661fb; code/test giữ nguyên bản dev đã nghiệm thu, chỉ cập nhật trạng thái trong báo cáo này.

## Vai trò Portal

React không kết nối Redis và không có Redis host/password/client SDK. Portal tiếp tục dùng apiClient.js với cookie + CSRF và platformSettingsService.js hiện có.

Luồng: Admin sửa cấu hình → service Portal gọi PUT /api/admin/settings → Backend kiểm tra quyền/validate → PostgreSQL commit dữ liệu + tăng shared_cache_versions → lần GET /api/game/settings kế tiếp chọn revision mới → Unity nhận giá trị mới khi refresh. Các nhóm lesson rules, features và achievement availability có invalidation tương ứng ở Backend.

Redis không cache quyền Admin/Instructor hoặc session Portal. Tài khoản bị vô hiệu hóa vẫn bị Backend từ chối theo luồng auth hiện hành.

## Thay đổi trong repo này

- Thêm tests/redisContract.test.js: dùng service login/settings thật qua HTTP proxy, có cookie/CSRF thật; warm view Game, lưu tên hệ thống, xác nhận Game đọc ngay tên mới, rồi khôi phục settings và logout.
- Test mặc định bỏ qua. Chỉ chạy khi cung cấp URL loopback, tài khoản fixture và xác nhận rõ database riêng.
- Giữ giao diện và hợp đồng API hiện tại; README dẫn đến báo cáo này.
- Báo cáo Backend [redis.md](https://github.com/nhatminh1008/AlgoVenture_Backend/blob/main/redis.md) mô tả outbox, ZSET, worker, V49, failure và vận hành.

## Chạy test tích hợp

Chỉ dùng Portal proxy đến Backend trên DB test riêng. Đặt ALGOVENTURE_REDIS_TEST_PORTAL thành URL Portal fixture, ALGOVENTURE_REDIS_DISPOSABLE=true, ALGOVENTURE_REDIS_TEST_ADMIN_EMAIL và ALGOVENTURE_REDIS_TEST_ADMIN_PASSWORD bằng tài khoản test; chạy:

~~~text
node --test tests/redisContract.test.js
~~~

Không trỏ fixture đến DB gốc, không commit giá trị credential.

## Kết quả
Build và lint đạt (1 warning duplicate key cũ); 37 unit test đạt, 1 test opt-in bỏ qua khi không có fixture. Đã chạy riêng test Redis qua proxy thật: 1/1 đạt. Backend tương ứng đạt 474 ca, không lỗi, 3 skipped. Không đo hay khẳng định hiệu năng frontend từ benchmark Backend.

Ranking mới từ main Backend V48 là tổng điểm tốt nhất từng chặng đã xác minh, không phải completion × 100. Redis ở V49 giữ nguyên công thức đó. Invalidation Backend không phải push trực tiếp đến màn hình đang mở; client vẫn dùng response/refetch/refresh hiện có. Mặc định Redis tắt cho tới khi Backend được cấu hình riêng.
