package edu.algoventure;

import static edu.algoventure.PortalDtos.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Transactional
public class AdminController {
  final PortalStore store;
  final UserStore users;
  final PasswordEncoder passwords;

  public AdminController(PortalStore store, UserStore users, PasswordEncoder passwords) {
    this.store = store;
    this.users = users;
    this.passwords = passwords;
  }

  String actor(Authentication a) {
    return users.byEmail(a.getName()).id();
  }

  @GetMapping("/users")
  Object allUsers() {
    return store
        .db()
        .query(
            "SELECT * FROM app_users ORDER BY joined DESC",
            (r, n) ->
                new UserStore.Account(
                    r.getString("id"),
                    r.getString("email"),
                    r.getString("name"),
                    r.getString("role"),
                    r.getString("status"),
                    PortalStore.timestamp(r, "joined")));
  }

  @PostMapping("/users")
  @ResponseStatus(HttpStatus.CREATED)
  Object createUser(Authentication a, @Valid @RequestBody CreateUser v) {
    if (v.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw ApiException.bad("Mật khẩu tối đa 72 byte UTF-8.");
    String id = store.id();
    store
        .db()
        .update(
            "INSERT INTO app_users(id,email,name,password_hash,role,status) VALUES (?,?,?,?,?,?)",
            id,
            v.email().trim().toLowerCase(Locale.ROOT),
            v.name().trim(),
            passwords.encode(v.password()),
            v.role(),
            v.status());
    store.audit(actor(a), "user.create");
    return users.byId(id);
  }

  @PutMapping("/users/{id}")
  Object updateUser(Authentication a, @PathVariable String id, @Valid @RequestBody UpdateUser v) {
    // Lock every admin row in a stable order to preserve at least one active administrator.
    store.db().queryForList("SELECT id FROM app_users WHERE role='admin' ORDER BY id FOR UPDATE");
    var previous = users.byId(id);
    if (previous.role().equals("admin")
        && previous.status().equals("Active")
        && (!v.role().equals("admin") || !v.status().equals("Active"))
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM app_users WHERE role='admin' AND status='Active'",
                    Integer.class)
            <= 1) throw ApiException.bad("Phải giữ ít nhất một Admin đang hoạt động.");
    if (!v.role().equals("instructor")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE instructor_id=?", Integer.class, id)
            > 0)
      throw ApiException.bad("Hãy chuyển các lớp cho giảng viên khác trước khi đổi vai trò.");
    if (!v.role().equals("learner")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM enrollments WHERE user_id=?", Integer.class, id)
            > 0) throw ApiException.bad("Hãy gỡ đăng ký lớp trước khi đổi vai trò học viên.");
    store
        .db()
        .update(
            "UPDATE app_users SET name=?,role=?,status=? WHERE id=?",
            v.name().trim(),
            v.role(),
            v.status(),
            id);
    store.audit(actor(a), "user.update");
    return users.byId(id);
  }

  @GetMapping("/algorithms")
  Object algorithms() {
    return store
        .db()
        .query(
            "SELECT * FROM algorithms ORDER BY topic_id,name",
            (r, n) ->
                store.map(
                    "id",
                    r.getString("id"),
                    "topicId",
                    r.getString("topic_id"),
                    "name",
                    r.getString("name"),
                    "difficulty",
                    r.getString("difficulty"),
                    "status",
                    r.getString("status"),
                    "config",
                    store.decode(r.getString("config"))));
  }

  record Config(
      @Min(10) @Max(86400) int timeLimit,
      @NotNull @Size(min = 3, max = 3) List<@NotNull @Min(1) Integer> starThresholds,
      boolean hintsAllowed,
      @NotNull @Size(max = 25) List<@NotBlank String> prerequisites) {}

  record Algorithm(
      @NotBlank @Size(max = 100) String name,
      @NotNull @Pattern(regexp = "Easy|Medium|Hard") String difficulty,
      @NotNull @Pattern(regexp = "Draft|Published") String status,
      @NotNull @Valid Config config) {}

  @PutMapping("/algorithms/{id}")
  Object configure(Authentication a, @PathVariable String id, @Valid @RequestBody Algorithm v) {
    List<Integer> stars = v.config().starThresholds();
    if (stars.get(0) >= stars.get(1) || stars.get(1) >= stars.get(2))
      throw ApiException.bad("Ngưỡng điểm sao phải tăng dần.");
    Set<String> prerequisites = new HashSet<>(v.config().prerequisites());
    if (prerequisites.size() != v.config().prerequisites().size() || prerequisites.contains(id))
      throw ApiException.bad("Điều kiện tiên quyết không hợp lệ.");
    for (String pid : prerequisites)
      if (store
              .db()
              .queryForObject("SELECT COUNT(*) FROM algorithms WHERE id=?", Integer.class, pid)
          != 1) throw ApiException.bad("Bài tiên quyết không tồn tại.");
    if (store
            .db()
            .update(
                "UPDATE algorithms SET name=?,difficulty=?,status=?,config=? WHERE id=?",
                v.name().trim(),
                v.difficulty(),
                v.status(),
                store.encode(v.config()),
                id)
        != 1) throw ApiException.missing();
    store.audit(actor(a), "algorithm.configure");
    return algorithms();
  }

  @GetMapping("/features")
  Object features() {
    return store
        .db()
        .query(
            "SELECT * FROM feature_toggles ORDER BY category,title",
            (r, n) ->
                store.map(
                    "id",
                    r.getString("id"),
                    "category",
                    r.getString("category"),
                    "title",
                    r.getString("title"),
                    "description",
                    r.getString("description"),
                    "enabled",
                    r.getBoolean("enabled")));
  }

  record Feature(@NotNull Boolean enabled) {}

  @PutMapping("/features/{id}")
  Object toggle(Authentication a, @PathVariable String id, @Valid @RequestBody Feature v) {
    if (store.db().update("UPDATE feature_toggles SET enabled=? WHERE id=?", v.enabled(), id) != 1)
      throw ApiException.missing();
    store.audit(actor(a), "feature.configure");
    return features();
  }

  @GetMapping("/settings")
  Object settings() {
    return store
        .db()
        .query(
            "SELECT * FROM system_settings WHERE id=1",
            (r, n) ->
                store.map(
                    "platformName",
                    r.getString("platform_name"),
                    "maintenance",
                    r.getBoolean("maintenance")))
        .getFirst();
  }

  record Settings(@NotBlank @Size(max = 100) String platformName, boolean maintenance) {}

  @PutMapping("/settings")
  Object settings(Authentication a, @Valid @RequestBody Settings v) {
    store
        .db()
        .update(
            "UPDATE system_settings SET platform_name=?,maintenance=? WHERE id=1",
            v.platformName().trim(),
            v.maintenance());
    store.audit(actor(a), "settings.save");
    return settings();
  }

  @GetMapping("/analytics")
  Object analytics() {
    var counts =
        store.map(
            "users",
            count("app_users"),
            "classrooms",
            count("classrooms"),
            "assignments",
            count("assignments"),
            "quizzes",
            count("quizzes"),
            "materials",
            count("materials"),
            "enrollments",
            count("enrollments"),
            "algorithms",
            count("algorithms"));
    return store.map(
        "counts",
        counts,
        "roles",
        store
            .db()
            .query(
                "SELECT role,COUNT(*) AS total FROM app_users GROUP BY role ORDER BY role",
                (r, n) -> store.map("name", r.getString("role"), "value", r.getLong("total"))),
        "logs",
        store
            .db()
            .query(
                "SELECT e.action,e.created_at,u.name FROM audit_events e LEFT JOIN app_users u ON"
                    + " u.id=e.actor_id ORDER BY e.created_at DESC LIMIT 50",
                (r, n) ->
                    store.map(
                        "action",
                        r.getString("action"),
                        "createdAt",
                        PortalStore.timestamp(r, "created_at"),
                        "actor",
                        r.getString("name"))),
        "learningResultsAvailable",
        true);
  }

  long count(String table) {
    return store.db().queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
  }

  @GetMapping("/export")
  Object export() {
    return store.map(
        "exportedAt",
        java.time.Instant.now().toString(),
        "users",
        allUsers(),
        "classrooms",
        classes(),
        "analytics",
        analytics(),
        "settings",
        settings());
  }

  @GetMapping("/classes")
  Object classes() {
    return store
        .db()
        .query("SELECT * FROM classrooms ORDER BY created_at DESC", (r, n) -> store.classroom(r));
  }

  record AssignInstructor(@NotBlank String instructorId) {}

  @PutMapping("/classes/{id}/instructor")
  Object assignInstructor(
      Authentication a, @PathVariable String id, @Valid @RequestBody AssignInstructor v) {
    var instructor = users.byId(v.instructorId());
    if (!instructor.role().equals("instructor") || !instructor.status().equals("Active"))
      throw ApiException.bad("Chọn Instructor đang hoạt động.");
    if (store.db().update("UPDATE classrooms SET instructor_id=? WHERE id=?", v.instructorId(), id)
        != 1) throw ApiException.missing();
    store.audit(actor(a), "classroom.assign-instructor");
    return classes();
  }

  record Enrollment(@NotBlank String userId) {}

  @PostMapping("/classes/{id}/members")
  @ResponseStatus(HttpStatus.CREATED)
  Object enroll(Authentication a, @PathVariable String id, @Valid @RequestBody Enrollment v) {
    var user = users.byId(v.userId());
    if (!user.role().equals("learner") || !user.status().equals("Active"))
      throw ApiException.bad("Chọn Learner đang hoạt động.");
    if (store.db().queryForObject("SELECT COUNT(*) FROM classrooms WHERE id=?", Integer.class, id)
        != 1) throw ApiException.missing();
    store
        .db()
        .update(
            "INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",
            store.id(),
            id,
            v.userId());
    store.audit(actor(a), "enrollment.create");
    return members(id);
  }

  @GetMapping("/classes/{id}/members")
  Object members(@PathVariable String id) {
    return store
        .db()
        .query(
            "SELECT u.id,u.name,u.email FROM app_users u JOIN enrollments e ON e.user_id=u.id WHERE"
                + " e.class_id=? ORDER BY u.name",
            (r, n) ->
                store.map(
                    "id",
                    r.getString("id"),
                    "name",
                    r.getString("name"),
                    "email",
                    r.getString("email")),
            id);
  }

  @DeleteMapping("/classes/{id}/members/{uid}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void unenroll(Authentication a, @PathVariable String id, @PathVariable String uid) {
    if (store.db().update("DELETE FROM enrollments WHERE class_id=? AND user_id=?", id, uid) != 1)
      throw ApiException.missing();
    store.audit(actor(a), "enrollment.remove");
  }
}
