package edu.algoventure;

import static edu.algoventure.PortalDtos.*;

import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/instructor")
@Transactional
public class InstructorController {
  final PortalStore store;
  final UserStore users;

  public InstructorController(PortalStore store, UserStore users) {
    this.store = store;
    this.users = users;
  }

  String owner(Authentication a) {
    return users.byEmail(a.getName()).id();
  }

  @GetMapping("/state")
  Map<String, Object> state(Authentication a) {
    return store.state(owner(a));
  }

  @GetMapping("/curriculum")
  Object curriculum() {
    return store.catalog().topics;
  }

  @GetMapping("/classes/{id}/practice")
  Object practice(Authentication a,@PathVariable String id) {
    store.ownedClass(id,owner(a));
    var assignmentIds=new HashSet<>(store.db().query("SELECT id FROM assignments WHERE class_id=?",(r,n)->r.getString(1),id));
    var students=store.db().query("SELECT u.id,u.name FROM enrollments e JOIN app_users u ON u.id=e.user_id WHERE e.class_id=? ORDER BY u.name,u.id",(r,n)->store.map("userId",r.getString(1),"name",r.getString(2)),id);
    for(var student:students) {
      int minigames=0,supplementary=0,observations=0,correct=0;
      var attempts=store.db().queryForList("SELECT client_attempt_id,metadata,status FROM learning_attempts WHERE user_id=? ORDER BY received_at",student.get("userId"));
      for(var attempt:attempts) {
        var metadata=(Map<?,?>)store.decode((String)attempt.get("metadata"));
        // Only evidence explicitly attached to this class; free practice remains private here.
        if(!"classroom".equals(metadata.get("source")) || !assignmentIds.contains(metadata.get("assignmentId"))) continue;
        if("supplementary".equals(metadata.get("activity"))) supplementary++; else minigames++;
        for(var row:store.db().queryForList("SELECT evaluation FROM learning_interactions WHERE user_id=? AND client_attempt_id=? AND kind='move'",student.get("userId"),attempt.get("client_attempt_id"))) {
          var evaluation=(Map<?,?>)store.decode((String)row.get("evaluation"));
          if(Boolean.TRUE.equals(evaluation.get("firstResponse"))) { observations++; if(Boolean.TRUE.equals(evaluation.get("correct"))) correct++; }
        }
      }
      student.putAll(store.map("minigameAttempts",minigames,"supplementaryAttempts",supplementary,"observations",observations,"correctFirstResponses",correct));
    }
    return store.map("students",students,"knowledgeComponent",LearningLogController.KC,"estimateStatus","not_available");
  }

  @PostMapping("/classes")
  @ResponseStatus(HttpStatus.CREATED)
  Object createClass(Authentication a, @Valid @RequestBody Classroom v) {
    return store.saveClass(owner(a), null, v);
  }

  @PutMapping("/classes/{id}")
  Object updateClass(Authentication a, @PathVariable String id, @Valid @RequestBody Classroom v) {
    return store.saveClass(owner(a), id, v);
  }

  @PostMapping("/assignments")
  @ResponseStatus(HttpStatus.CREATED)
  Object createAssignment(Authentication a, @Valid @RequestBody Assignment v) {
    return store.saveAssignment(owner(a), null, v);
  }

  @PutMapping("/assignments/{id}")
  Object updateAssignment(
      Authentication a, @PathVariable String id, @Valid @RequestBody Assignment v) {
    return store.saveAssignment(owner(a), id, v);
  }

  @PostMapping("/quizzes")
  @ResponseStatus(HttpStatus.CREATED)
  Object createQuiz(Authentication a, @Valid @RequestBody Quiz v) {
    return store.saveQuiz(owner(a), null, v);
  }

  @PutMapping("/quizzes/{id}")
  Object updateQuiz(Authentication a, @PathVariable String id, @Valid @RequestBody Quiz v) {
    return store.saveQuiz(owner(a), id, v);
  }

  @DeleteMapping("/quizzes/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void deleteQuiz(Authentication a, @PathVariable String id) {
    store.removeQuiz(owner(a), id);
  }

  Map<String, Object> material(java.sql.ResultSet r) throws java.sql.SQLException {
    return store.map(
        "id",
        r.getString("id"),
        "classId",
        r.getString("class_id"),
        "title",
        r.getString("title"),
        "description",
        r.getString("description"),
        "filename",
        r.getString("filename"),
        "size",
        r.getLong("size"),
        "type",
        r.getString("type"),
        "uploadedAt",
        PortalStore.timestamp(r, "uploaded_at"));
  }

  @GetMapping("/classes/{cid}/materials")
  Object materials(Authentication a, @PathVariable String cid) {
    store.ownedClass(cid, owner(a));
    return store
        .db()
        .query(
            "SELECT id,class_id,title,description,filename,size,type,uploaded_at FROM materials"
                + " WHERE class_id=? ORDER BY uploaded_at DESC",
            (r, n) -> material(r),
            cid);
  }

  static final Map<String, String> TYPES =
      Map.of(
          "pdf",
          "application/pdf",
          "txt",
          "text/plain",
          "docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "pptx",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation");

  @PostMapping("/classes/{cid}/materials")
  @ResponseStatus(HttpStatus.CREATED)
  Object upload(
      Authentication a,
      @PathVariable String cid,
      @RequestParam MultipartFile file,
      @RequestParam String title,
      @RequestParam(defaultValue = "") String description)
      throws IOException {
    String owner = owner(a);
    store.ownedClass(cid, owner);
    String filename = Objects.toString(file.getOriginalFilename(), "").replace('\\', '/');
    filename = filename.substring(filename.lastIndexOf('/') + 1);
    String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    if (!TYPES.containsKey(extension)
        || file.isEmpty()
        || file.getSize() > 10 * 1024 * 1024
        || filename.length() > 255
        || filename.chars().anyMatch(Character::isISOControl))
      throw ApiException.bad("Invalid file. Supports PDF, DOCX, PPTX, TXT up to 10 MB.");
    if (title.isBlank() || title.trim().length() > 120 || description.length() > 500)
      throw ApiException.bad("Document title max 120 characters, description max 500 characters.");
    String id = store.id();
    store
        .db()
        .update(
            "INSERT INTO materials(id,class_id,title,description,filename,size,type,content) VALUES"
                + " (?,?,?,?,?,?,?,?)",
            id,
            cid,
            title.trim(),
            description.trim(),
            filename,
            file.getSize(),
            TYPES.get(extension),
            file.getBytes());
    store.audit(owner, "material.upload");
    return store
        .db()
        .query("SELECT * FROM materials WHERE id=?", (r, n) -> material(r), id)
        .getFirst();
  }

  @GetMapping("/classes/{cid}/materials/{id}/download")
  ResponseEntity<byte[]> download(
      Authentication a, @PathVariable String cid, @PathVariable String id) {
    store.ownedClass(cid, owner(a));
    return store
        .db()
        .query(
            "SELECT * FROM materials WHERE id=? AND class_id=?",
            (r, n) ->
                ResponseEntity.ok()
                    .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                            .filename(r.getString("filename"), StandardCharsets.UTF_8)
                            .build()
                            .toString())
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(r.getBytes("content")),
            id,
            cid)
        .stream()
        .findFirst()
        .orElseThrow(ApiException::missing);
  }

  @DeleteMapping("/classes/{cid}/materials/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void deleteMaterial(Authentication a, @PathVariable String cid, @PathVariable String id) {
    String owner = owner(a);
    store.ownedClass(cid, owner);
    if (store
            .db()
            .queryForObject(
                "SELECT COUNT(*) FROM quiz_materials WHERE material_id=?", Integer.class, id)
        > 0) throw ApiException.bad("Material is being used by quiz questions.");
    if (store.db().update("DELETE FROM materials WHERE id=? AND class_id=?", id, cid) != 1)
      throw ApiException.missing();
    store.audit(owner, "material.delete");
  }
}
