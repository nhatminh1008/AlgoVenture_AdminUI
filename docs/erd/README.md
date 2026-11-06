# AlgoVenture — ERD theo mã nguồn, 05/11/2026

23 bảng nghiệp vụ, 28 FK SQL, 132 cột. Đọc/lập chỉ mục 936 file từ portal/backend/AI service và Game.

- `algoventure-erd.html`: sơ đồ theo cụm, danh mục FK, từ điển dữ liệu đầy đủ.
- `algoventure-erd.mmd`: mã Mermaid cho toàn bộ schema, có thể nhập vào công cụ hỗ trợ Mermaid.
- `schema.json`: mô hình schema đã trích xuất.
- `source-inventory.json`: phạm vi file đã đọc và hash SHA-256.
- `build_erd.py`: dựng lại artifact bằng Python, chỉ đọc nguồn và ghi file tài liệu.

1. Phạm vi: backend Spring Boot + portal Admin/Instructor trong AlgoVenture_AdminUI, đối chiếu Game algoven5/proto_algo và ai-service. Đây là schema suy ra từ mã nguồn ngày 05/11/2026; chưa truy vấn database đang chạy.

2. Hai migration trùng phiên bản V6: V6__adaptive_recommendations.sql và V6__password_reset_tokens.sql. Flyway thông thường sẽ từ chối phiên bản trùng. Sơ đồ bao gồm định nghĩa của cả hai file; chưa chứng minh chúng đã được áp dụng trên database.

3. Admin, Instructor và Learner dùng chung app_users; role là cột, không có bảng roles, admins, instructors hoặc students riêng. Giới hạn vai trò trong quan hệ lớp học do mã ứng dụng kiểm tra.

4. game_classroom_accounts còn trong migration V3, không có tham chiếu trong Java runtime hiện tại. Giữ bảng này trong ERD và đánh dấu legacy; game_id hiện hành nằm trong learner_profiles.

5. assignments là bộ thử thách minigame; quizzes là thực thể riêng. Dù API Classroom gọi cả hai là assignment, quiz_attempts.quiz_id chỉ tham chiếu quizzes.id.

6. quizzes.questions chứa JSON Question/Option; quiz_attempts.result chứa JSON đáp án/kết quả. Không có bảng questions, options hoặc answers riêng.

7. assignments.lesson_ids và lesson_configs lưu JSON trong TEXT. Quan hệ bài giao–algorithms là liên kết ứng dụng, không có bảng assignment_lessons hoặc khóa ngoại SQL cho danh sách này.

8. algorithms.config chứa JSON, gồm prerequisites. topic_id của algorithms/classrooms được đối chiếu curriculum.json; không có bảng topics hay bảng prerequisites.

9. learning_attempts.metadata chứa assignmentId, recommendationId, exerciseId và ngữ cảnh lượt chơi. adaptive_recommendations.context_json chứa assignmentId; các liên kết này không phải FK SQL.

10. GameController nối bubble_challenges.id với learning_attempts.client_attempt_id cùng user_id. Đây là phép nối trong code, không phải FK; một đề có thể chưa có log, và log bổ trợ có thể không có đề cấp từ bubble_challenges.

11. Leaderboard, điểm trung bình, phần trăm tiến độ và ngày thực hành được tính từ dữ liệu lưu sẵn; không có bảng leaderboard, mastery hoặc knowledge_components. Danh sách bài bổ trợ nằm trong PracticeCatalog.java; ai-service không định nghĩa bảng riêng.

12. Portal dùng HttpSession, không có Spring Session JDBC trong pom.xml và không có bảng session portal trong migration. learner_sessions chỉ là phiên Bearer của Game/Classroom.

13. V9 và V10 là migration Java chỉnh dữ liệu JSON/catalog và giữ lịch sử hoàn thành, không thêm bảng/cột. Vì giữ dữ liệu cũ, algorithms có thể có các ID Retired bên cạnh 29 bài hiện hành.

14. Cardinality trong sơ đồ là ràng buộc SQL: bảng con luôn có thể có 0 dòng. learner_profiles và game_classroom_accounts tối đa 1 dòng cho mỗi app_users nhờ PK/UNIQUE; audit_events.actor_id và bubble_challenges.assignment_id cho phép NULL.

Để dễ đọc, các cụm lặp lại thực thể cha và chỉ chọn tối đa 5 trường/bảng. Không bỏ bảng hoặc FK SQL nào: bảng cấu hình đứng riêng; từ điển giữ tất cả cột. Các liên kết JSON/code được ghi chú riêng, không vẽ như ràng buộc database.
