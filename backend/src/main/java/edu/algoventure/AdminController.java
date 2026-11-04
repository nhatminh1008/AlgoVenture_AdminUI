package edu.algoventure;

import static edu.algoventure.PortalDtos.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Admin Management", description = "API for Admin operations - Admin only")
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
  @Operation(
      summary = "Get list of users",
      description =
          "Get paginated list of users with search by name/email and filter by role")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Success"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
  })
  Object allUsers(
      @Parameter(description = "Page number (starts from 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Number of records per page (1-100)") @RequestParam(defaultValue = "20") int size,
      @Parameter(description = "Search by name or email") @RequestParam(required = false) String search,
      @Parameter(description = "Filter by role (admin, instructor, learner)") @RequestParam(required = false) String role) {
    if (page < 0) page = 0;
    if (size < 1 || size > 100) size = 20;

    StringBuilder sql = new StringBuilder("SELECT * FROM app_users WHERE 1=1");
    List<Object> params = new ArrayList<>();

    if (search != null && !search.isBlank()) {
      sql.append(" AND (name ILIKE ? OR email ILIKE ?)");
      String searchPattern = "%" + search.trim() + "%";
      params.add(searchPattern);
      params.add(searchPattern);
    }

    if (role != null && !role.isBlank()) {
      sql.append(" AND role = ?");
      params.add(role);
    }

    String countSql = sql.toString().replace("SELECT *", "SELECT COUNT(*)");
    long total = store.db().queryForObject(countSql, Long.class, params.toArray());

    sql.append(" ORDER BY joined DESC LIMIT ? OFFSET ?");
    params.add(size);
    params.add(page * size);

    List<UserStore.Account> users =
        store
            .db()
            .query(
                sql.toString(),
                (r, n) ->
                    new UserStore.Account(
                        r.getString("id"),
                        r.getString("email"),
                        r.getString("name"),
                        r.getString("role"),
                        r.getString("status"),
                        PortalStore.timestamp(r, "joined")),
                params.toArray());

    int totalPages = (int) Math.ceil((double) total / size);
    return new PaginatedResponse<>(users, total, page, size, totalPages);
  }

  @GetMapping("/users/{id}")
  @Operation(summary = "Get user details", description = "Get detailed information of a user by ID")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Success"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "User not found")
  })
  UserStore.Account getUserById(
      @Parameter(description = "User ID") @PathVariable String id) {
    return users.byId(id);
  }

  @PostMapping("/users")
  @ResponseStatus(HttpStatus.CREATED)
  Object createUser(Authentication a, @Valid @RequestBody CreateUser v) {
    if (v.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw ApiException.bad("Password maximum 72 UTF-8 bytes.");
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
  @Operation(summary = "Update user", description = "Update user name, role and status (legacy endpoint for Frontend compatibility)")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Update successful"),
    @ApiResponse(responseCode = "400", description = "Invalid data or constraint violation"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "User not found")
  })
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
            <= 1) throw ApiException.bad("Must keep at least one active Admin.");
    if (!v.role().equals("instructor")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE instructor_id=?", Integer.class, id)
            > 0)
      throw ApiException.bad("Transfer classes to another instructor before changing role.");
    if (!v.role().equals("learner")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM enrollments WHERE user_id=?", Integer.class, id)
            > 0) throw ApiException.bad("Remove class enrollments before changing to non-learner role.");
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

  @PutMapping("/users/{id}/role")
  @Operation(summary = "Change user role", description = "Allow Admin to change user role (admin, instructor, learner)")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Change successful"),
    @ApiResponse(responseCode = "400", description = "Invalid data or constraint violation"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "User not found")
  })
  UserStore.Account updateUserRole(
      Authentication a,
      @Parameter(description = "User ID") @PathVariable String id,
      @Valid @RequestBody UpdateUserRole v) {
    String currentUserId = actor(a);
    var targetUser = users.byId(id);

    // Reject if user is Inactive
    if (!targetUser.status().equals("Active"))
      throw ApiException.bad("Cannot change role of inactive account.");

    // Prevent self-downgrade if it would leave no active admin
    if (targetUser.role().equals("admin")
        && targetUser.status().equals("Active")
        && !v.role().equals("admin")
        && currentUserId.equals(id)
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM app_users WHERE role='admin' AND status='Active'",
                    Integer.class)
            <= 1) throw ApiException.bad("Cannot change your own role - must keep at least one active Admin.");

    if (!v.role().equals("instructor")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE instructor_id=?", Integer.class, id)
            > 0)
      throw ApiException.bad("Transfer classes to another instructor before changing role.");

    if (!v.role().equals("learner")
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM enrollments WHERE user_id=?", Integer.class, id)
            > 0) throw ApiException.bad("Remove class enrollments before changing to non-learner role.");

    store.db().update("UPDATE app_users SET role=? WHERE id=?", v.role(), id);
    store.audit(actor(a), "user.update.role");
    return users.byId(id);
  }

  @PutMapping("/users/{id}/status")
  @Operation(
      summary = "Activate/Deactivate account",
      description =
          "Change account status (active: true = Active, false = Suspended). "
              + "Suspended accounts cannot login.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Change successful"),
    @ApiResponse(responseCode = "400", description = "Invalid data or constraint violation"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "User not found")
  })
  UserStore.Account updateUserStatus(
      Authentication a,
      @Parameter(description = "User ID") @PathVariable String id,
      @Valid @RequestBody UpdateUserStatus v) {
    String currentUserId = actor(a);
    var targetUser = users.byId(id);

    String newStatus = v.active() ? "Active" : "Suspended";

    // If deactivating, check user is currently Active
    if (!v.active() && !targetUser.status().equals("Active"))
      throw ApiException.bad("Cannot deactivate already inactive account.");

    // If activating, check user is currently Suspended
    if (v.active() && !targetUser.status().equals("Suspended"))
      throw ApiException.bad("Cannot activate already active account.");

    // Prevent self-deactivation if it would leave no active admin
    if (!v.active()
        && targetUser.role().equals("admin")
        && targetUser.status().equals("Active")
        && currentUserId.equals(id)
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM app_users WHERE role='admin' AND status='Active'",
                    Integer.class)
            <= 1) throw ApiException.bad("Cannot deactivate yourself - must keep at least one active Admin.");

    store.db().update("UPDATE app_users SET status=? WHERE id=?", newStatus, id);
    store.audit(actor(a), "user.update.status");
    return users.byId(id);
  }

  // Instructor Management Endpoints

  @GetMapping("/instructors")
  @Operation(
      summary = "Get list of instructors",
      description =
          "Get paginated list of instructors with search by name/email and filter by status")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Success"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
  })
  Object allInstructors(
      @Parameter(description = "Page number (starts from 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Number of records per page (1-100)") @RequestParam(defaultValue = "20") int size,
      @Parameter(description = "Search by name or email") @RequestParam(required = false) String search,
      @Parameter(description = "Filter by status (Active, Suspended)") @RequestParam(required = false) String status) {
    if (page < 0) page = 0;
    if (size < 1 || size > 100) size = 20;

    StringBuilder sql = new StringBuilder("SELECT * FROM app_users WHERE role='instructor'");
    List<Object> params = new ArrayList<>();

    if (search != null && !search.isBlank()) {
      sql.append(" AND (name ILIKE ? OR email ILIKE ?)");
      String searchPattern = "%" + search.trim() + "%";
      params.add(searchPattern);
      params.add(searchPattern);
    }

    if (status != null && !status.isBlank()) {
      sql.append(" AND status = ?");
      params.add(status);
    }

    String countSql = sql.toString().replace("SELECT *", "SELECT COUNT(*)");
    long total = store.db().queryForObject(countSql, Long.class, params.toArray());

    sql.append(" ORDER BY joined DESC LIMIT ? OFFSET ?");
    params.add(size);
    params.add(page * size);

    List<UserStore.Account> instructors =
        store
            .db()
            .query(
                sql.toString(),
                (r, n) ->
                    new UserStore.Account(
                        r.getString("id"),
                        r.getString("email"),
                        r.getString("name"),
                        r.getString("role"),
                        r.getString("status"),
                        PortalStore.timestamp(r, "joined")),
                params.toArray());

    int totalPages = (int) Math.ceil((double) total / size);
    return new PaginatedResponse<>(instructors, total, page, size, totalPages);
  }

  @PostMapping("/instructors")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create instructor", description = "Create a new instructor account")
  @ApiResponses({
    @ApiResponse(responseCode = "201", description = "Instructor created successfully"),
    @ApiResponse(responseCode = "400", description = "Invalid data"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "409", description = "Email already exists")
  })
  Object createInstructor(Authentication a, @Valid @RequestBody CreateInstructor v) {
    if (v.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw ApiException.bad("Password maximum 72 UTF-8 bytes.");
    String id = store.id();
    store
        .db()
        .update(
            "INSERT INTO app_users(id,email,name,password_hash,role,status) VALUES (?,?,?,?,?,?)",
            id,
            v.email().trim().toLowerCase(Locale.ROOT),
            v.name().trim(),
            passwords.encode(v.password()),
            "instructor",
            "Active");
    store.audit(actor(a), "instructor.create");
    return users.byId(id);
  }

  @GetMapping("/instructors/{id}")
  @Operation(summary = "Get instructor details", description = "Get detailed information of an instructor by ID")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Success"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "Instructor not found")
  })
  UserStore.Account getInstructorById(
      @Parameter(description = "Instructor ID") @PathVariable String id) {
    var user = users.byId(id);
    if (!user.role().equals("instructor")) throw ApiException.missing();
    return user;
  }

  @PutMapping("/instructors/{id}")
  @Operation(summary = "Update instructor information", description = "Update name of an instructor")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Update successful"),
    @ApiResponse(responseCode = "400", description = "Invalid data or account inactive"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "Instructor not found")
  })
  UserStore.Account updateInstructorInfo(
      Authentication a,
      @Parameter(description = "Instructor ID") @PathVariable String id,
      @Valid @RequestBody UpdateInstructorInfo v) {
    var user = users.byId(id);
    if (!user.role().equals("instructor")) throw ApiException.missing();

    // Reject if instructor is Inactive
    if (!user.status().equals("Active"))
      throw ApiException.bad("Cannot update information of inactive instructor.");

    store.db().update("UPDATE app_users SET name=? WHERE id=?", v.name().trim(), id);
    store.audit(actor(a), "instructor.update.info");
    return users.byId(id);
  }

  @PutMapping("/instructors/{id}/status")
  @Operation(
      summary = "Activate/Deactivate instructor",
      description =
          "Change instructor status (active: true = Active, false = Suspended). "
              + "Cannot suspend instructor with active classrooms.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Change successful"),
    @ApiResponse(responseCode = "400", description = "Invalid data or constraint violation"),
    @ApiResponse(responseCode = "401", description = "Unauthorized"),
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
    @ApiResponse(responseCode = "404", description = "Instructor not found")
  })
  UserStore.Account updateInstructorStatus(
      Authentication a,
      @Parameter(description = "Instructor ID") @PathVariable String id,
      @Valid @RequestBody UpdateUserStatus v) {
    var user = users.byId(id);
    if (!user.role().equals("instructor")) throw ApiException.missing();

    String newStatus = v.active() ? "Active" : "Suspended";

    // If deactivating, check for active classrooms
    if (!v.active()
        && store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE instructor_id=?", Integer.class, id)
            > 0) throw ApiException.bad("Cannot suspend instructor with active classrooms.");

    store.db().update("UPDATE app_users SET status=? WHERE id=?", newStatus, id);
    store.audit(actor(a), "instructor.update.status");
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
      throw ApiException.bad("Star thresholds must be increasing.");
    Set<String> prerequisites = new HashSet<>(v.config().prerequisites());
    if (prerequisites.size() != v.config().prerequisites().size() || prerequisites.contains(id))
      throw ApiException.bad("Invalid prerequisites.");
    for (String pid : prerequisites)
      if (store
              .db()
              .queryForObject("SELECT COUNT(*) FROM algorithms WHERE id=?", Integer.class, pid)
          != 1) throw ApiException.bad("Prerequisite lesson does not exist.");
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
      throw ApiException.bad("Select an active Instructor.");
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
      throw ApiException.bad("Select an active Learner.");
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
