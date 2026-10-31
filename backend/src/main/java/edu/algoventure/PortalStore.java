package edu.algoventure;

import static edu.algoventure.PortalDtos.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PortalStore {
  final JdbcTemplate db;
  final ObjectMapper json;
  final Catalog catalog;

  public PortalStore(JdbcTemplate db, ObjectMapper json, Catalog catalog) {
    this.db = db;
    this.json = json;
    this.catalog = catalog;
  }

  static String timestamp(ResultSet r, String key) throws SQLException {
    return r.getObject(key, java.time.OffsetDateTime.class).toInstant().toString();
  }

  public JdbcTemplate db() {
    return db;
  }

  public Catalog catalog() {
    return catalog;
  }

  String id() {
    return UUID.randomUUID().toString();
  }

  String encode(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }

  Object decode(String value) {
    try {
      return json.readValue(value, Object.class);
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }

  Map<String, Object> map(Object... pairs) {
    Map<String, Object> result = new LinkedHashMap<>();
    for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
    return result;
  }

  void audit(String actor, String action) {
    db.update("INSERT INTO audit_events(id,actor_id,action) VALUES (?,?,?)", id(), actor, action);
  }

  Map<String, Object> classroom(ResultSet r) throws SQLException {
    return map(
        "id",
        r.getString("id"),
        "instructorId",
        r.getString("instructor_id"),
        "name",
        r.getString("name"),
        "description",
        r.getString("description"),
        "topicId",
        r.getString("topic_id"),
        "level",
        r.getString("level"),
        "createdAt",
        PortalStore.timestamp(r, "created_at"));
  }

  Map<String, Object> ownedClass(String classId, String owner) {
    // Serialize writes within a class, including quiz publication and material deletion.
    return db
        .query(
            "SELECT * FROM classrooms WHERE id=? AND instructor_id=? FOR UPDATE",
            (r, n) -> classroom(r),
            classId,
            owner)
        .stream()
        .findFirst()
        .orElseThrow(ApiException::missing);
  }

  Map<String, Object> assignment(ResultSet r) throws SQLException {
    return map(
        "id",
        r.getString("id"),
        "classId",
        r.getString("class_id"),
        "title",
        r.getString("title"),
        "description",
        r.getString("description"),
        "status",
        r.getString("status"),
        "due",
        Objects.toString(r.getDate("due"), ""),
        "lessonIds",
        decode(r.getString("lesson_ids")));
  }

  Map<String, Object> quiz(ResultSet r) throws SQLException {
    String quizId = r.getString("id");
    return map(
        "id",
        quizId,
        "classId",
        r.getString("class_id"),
        "title",
        r.getString("title"),
        "description",
        r.getString("description"),
        "status",
        r.getString("status"),
        "due",
        Objects.toString(r.getDate("due"), ""),
        "questions",
        decode(r.getString("questions")),
        "createdAt",
        PortalStore.timestamp(r, "created_at"),
        "updatedAt",
        PortalStore.timestamp(r, "updated_at"),
        "materialIds",
        db.query(
            "SELECT material_id FROM quiz_materials WHERE quiz_id=?",
            (x, n) -> x.getString(1),
            quizId));
  }

  public Map<String, Object> state(String owner) {
    return map(
        "classes",
        db.query(
            "SELECT * FROM classrooms WHERE instructor_id=? ORDER BY created_at",
            (r, n) -> classroom(r),
            owner),
        "assignments",
        db.query(
            "SELECT a.* FROM assignments a JOIN classrooms c ON c.id=a.class_id WHERE"
                + " c.instructor_id=? ORDER BY a.title",
            (r, n) -> assignment(r),
            owner),
        "quizzes",
        db.query(
            "SELECT q.* FROM quizzes q JOIN classrooms c ON c.id=q.class_id WHERE c.instructor_id=?"
                + " ORDER BY q.created_at",
            (r, n) -> quiz(r),
            owner),
        "students",
        db.query(
            "SELECT e.id,e.class_id,u.name,u.email FROM enrollments e JOIN app_users u ON"
                + " u.id=e.user_id JOIN classrooms c ON c.id=e.class_id WHERE c.instructor_id=?"
                + " ORDER BY u.name",
            (r, n) ->
                map(
                    "id",
                    r.getString("id"),
                    "classId",
                    r.getString("class_id"),
                    "name",
                    r.getString("name"),
                    "email",
                    r.getString("email"),
                    "score",
                    null),
            owner));
  }

  public Map<String, Object> saveClass(String owner, String classId, Classroom v) {
    catalog.lessons(v.topicId());
    if (classId != null) {
      var existing = ownedClass(classId, owner);
      if (!existing.get("topicId").equals(v.topicId())
          && db.queryForObject(
                  "SELECT (SELECT COUNT(*) FROM assignments WHERE class_id=?) + (SELECT COUNT(*)"
                      + " FROM quizzes WHERE class_id=?)",
                  Integer.class,
                  classId,
                  classId)
              > 0) throw ApiException.bad("Lớp đã có bộ bài nên không thể đổi chủ đề.");
      db.update(
          "UPDATE classrooms SET name=?,name_key=?,description=?,topic_id=?,level=? WHERE id=?",
          v.name().trim(),
          v.name().trim().toLowerCase(Locale.ROOT),
          v.description().trim(),
          v.topicId(),
          v.level(),
          classId);
    } else {
      classId = id();
      db.update(
          "INSERT INTO classrooms(id,instructor_id,name,name_key,description,topic_id,level) VALUES"
              + " (?,?,?,?,?,?,?)",
          classId,
          owner,
          v.name().trim(),
          v.name().trim().toLowerCase(Locale.ROOT),
          v.description().trim(),
          v.topicId(),
          v.level());
    }
    audit(owner, "classroom.save");
    return ownedClass(classId, owner);
  }

  public Map<String, Object> saveAssignment(String owner, String assignmentId, Assignment v) {
    var c = ownedClass(v.classId(), owner);
    Set<String> lessons = catalog.lessons((String) c.get("topicId"));
    if (new HashSet<>(v.lessonIds()).size() != v.lessonIds().size()
        || !lessons.containsAll(v.lessonIds()))
      throw ApiException.bad("Bài học phải thuộc chủ đề của lớp và không trùng nhau.");
    if (v.status().equals("Active") && v.due() == null)
      throw ApiException.bad("Hãy đặt hạn hoàn thành trước khi giao bài.");
    if (v.status().equals("Closed"))
      throw ApiException.bad("Chỉ có thể lưu bản nháp hoặc giao bài.");
    if (assignmentId != null) {
      var previous =
          db
              .query(
                  "SELECT * FROM assignments WHERE id=? AND class_id=?",
                  (r, n) -> assignment(r),
                  assignmentId,
                  v.classId())
              .stream()
              .findFirst()
              .orElseThrow(ApiException::missing);
      if (!previous.get("status").equals("Draft"))
        throw ApiException.bad("Chỉ có thể sửa bản nháp.");
      db.update(
          "UPDATE assignments SET title=?,description=?,status=?,due=?,lesson_ids=? WHERE id=?",
          v.title().trim(),
          v.description(),
          v.status(),
          v.due(),
          encode(v.lessonIds()),
          assignmentId);
    } else {
      assignmentId = id();
      db.update(
          "INSERT INTO assignments(id,class_id,title,description,status,due,lesson_ids) VALUES"
              + " (?,?,?,?,?,?,?)",
          assignmentId,
          v.classId(),
          v.title().trim(),
          v.description(),
          v.status(),
          v.due(),
          encode(v.lessonIds()));
    }
    audit(owner, "assignment.save");
    return db.query("SELECT * FROM assignments WHERE id=?", (r, n) -> assignment(r), assignmentId)
        .getFirst();
  }

  void validateQuiz(Quiz v) {
    if (v.status().equals("Published") && v.questions().isEmpty())
      throw ApiException.bad("Thêm ít nhất một câu hỏi.");
    Set<String> ids = new HashSet<>();
    for (Question q : v.questions()) {
      if (!ids.add(q.id())) throw ApiException.bad("Mã câu hỏi bị trùng.");
      Set<String> options = new HashSet<>(), labels = new HashSet<>();
      for (Option option : q.options()) {
        if (!options.add(option.id())) throw ApiException.bad("Mã lựa chọn bị trùng.");
        if (v.status().equals("Published")
            && (option.text().isBlank()
                || !labels.add(option.text().trim().toLowerCase(Locale.ROOT))))
          throw ApiException.bad("Lựa chọn không được trống hoặc trùng nhau.");
      }
      if (!q.correctOptionId().isEmpty() && !options.contains(q.correctOptionId()))
        throw ApiException.bad("Đáp án không còn trong các lựa chọn.");
      if (v.status().equals("Published") && (q.prompt().isBlank() || q.correctOptionId().isBlank()))
        throw ApiException.bad("Câu hỏi cần có nội dung và đáp án đúng.");
    }
    if (new HashSet<>(v.materialIds()).size() != v.materialIds().size())
      throw ApiException.bad("Tài liệu bị trùng.");
    for (String mid : v.materialIds())
      if (db.queryForObject(
              "SELECT COUNT(*) FROM materials WHERE id=? AND class_id=?",
              Integer.class,
              mid,
              v.classId())
          != 1) throw ApiException.bad("Tài liệu không thuộc lớp này.");
  }

  public Map<String, Object> saveQuiz(String owner, String quizId, Quiz v) {
    ownedClass(v.classId(), owner);
    validateQuiz(v);
    if (quizId != null) {
      var previous =
          db
              .query(
                  "SELECT * FROM quizzes WHERE id=? AND class_id=?",
                  (r, n) -> quiz(r),
                  quizId,
                  v.classId())
              .stream()
              .findFirst()
              .orElseThrow(ApiException::missing);
      if (!previous.get("status").equals("Draft"))
        throw ApiException.bad("Nội dung đã công bố được giữ nguyên.");
      db.update(
          "UPDATE quizzes SET"
              + " title=?,description=?,status=?,due=?,questions=?,updated_at=CURRENT_TIMESTAMP"
              + " WHERE id=?",
          v.title().trim(),
          v.description(),
          v.status(),
          v.due(),
          encode(v.questions()),
          quizId);
      db.update("DELETE FROM quiz_materials WHERE quiz_id=?", quizId);
    } else {
      quizId = id();
      db.update(
          "INSERT INTO quizzes(id,class_id,title,description,status,due,questions) VALUES"
              + " (?,?,?,?,?,?,?)",
          quizId,
          v.classId(),
          v.title().trim(),
          v.description(),
          v.status(),
          v.due(),
          encode(v.questions()));
    }
    for (String mid : v.materialIds())
      db.update("INSERT INTO quiz_materials(quiz_id,material_id) VALUES (?,?)", quizId, mid);
    audit(owner, "quiz.save");
    return db.query("SELECT * FROM quizzes WHERE id=?", (r, n) -> quiz(r), quizId).getFirst();
  }

  public void removeQuiz(String owner, String quizId) {
    String cid =
        db
            .query("SELECT class_id FROM quizzes WHERE id=?", (r, n) -> r.getString(1), quizId)
            .stream()
            .findFirst()
            .orElseThrow(ApiException::missing);
    ownedClass(cid, owner);
    if (db.update("DELETE FROM quizzes WHERE id=? AND status='Draft'", quizId) != 1)
      throw ApiException.bad("Chỉ có thể xóa bản nháp.");
    audit(owner, "quiz.delete");
  }
}
