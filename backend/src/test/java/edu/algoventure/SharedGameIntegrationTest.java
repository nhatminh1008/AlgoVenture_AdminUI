package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class SharedGameIntegrationTest {
  @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired PortalStore store;
  @BeforeEach void enableLeaderboard() {
    store.db().update("UPDATE feature_toggles SET enabled=true WHERE id='leaderboard'");
  }
  JsonNode register(String email) throws Exception {
    return json.readTree(mvc.perform(post("/api/game/auth/register").contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password","Learner@12345","fullName","New Learner","role","admin","status","Suspended"))))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("LEARNER")).andExpect(jsonPath("$.password_hash").doesNotExist()).andReturn().getResponse().getContentAsString());
  }
  String bearer(JsonNode auth) { return "Bearer "+auth.path("token").asText(); }
  JsonNode getState(String token) throws Exception { return json.readTree(mvc.perform(get("/api/game/me/state").header("Authorization",token)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()); }
  String body(Object v) throws Exception { return json.writeValueAsString(v); }

  @Test void gameStateExposesAdminLessonRulesAndEnforcesLeaderboardToggle() throws Exception {
    String token=bearer(register("rules.shared@example.test"));
    store.db().update("UPDATE algorithms SET status='Draft' WHERE id='bubble'");
    store.db().update("UPDATE feature_toggles SET enabled=false WHERE id='leaderboard'");
    var state=getState(token);
    assertFalse(state.path("leaderboardEnabled").asBoolean(true));
    var rules=state.path("lessonRules");
    assertTrue(rules.isArray());
    for(var rule:rules) if(rule.path("id").asText().equals("bubble")) {
      assertFalse(rule.path("published").asBoolean(true));
      assertTrue(rule.path("prerequisites").isArray());
      mvc.perform(get("/api/game/leaderboard").header("Authorization",token)).andExpect(status().isNotFound());
      return;
    }
    fail("Bubble lesson rules are missing");
  }

  @Test void splitStackAndQueueLessonsPersistAndCountTowardInstructorAssignments() throws Exception {
    String email="split.operations@example.test",token=bearer(register(email));
    String uid=store.db().queryForObject("SELECT id FROM app_users WHERE email=?",String.class,email);
    String teacher=store.db().queryForObject("SELECT id FROM app_users WHERE email='instructor@algoventure.edu'",String.class);
    var classroom=store.saveClass(teacher,null,new PortalDtos.Classroom("Split operations","","data-structures","basic"));
    String cid=(String)classroom.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",store.id(),cid,uid);
    var ids=List.of("stack-push","stack-pop","stack-peek","queue-enqueue","queue-dequeue","queue-peek");
    var assignment=store.saveAssignment(teacher,null,new PortalDtos.Assignment(cid,"Operations","","Active",java.time.LocalDate.now().plusDays(7),ids));
    for(String id:ids) {
      assertEquals(1,store.db().queryForObject("SELECT COUNT(*) FROM algorithms WHERE id=? AND status='Published'",Integer.class,id));
      var completion=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId",id,"stage",1);
      for(int retry=0;retry<2;retry++) mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(completion)))
          .andExpect(status().isOk());
      assertTrue(getState(token).path("completed").path(id).asBoolean(),id);
    }
    assertEquals(6,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=?",Integer.class,assignment.get("id"),uid));
    assertEquals(6,store.db().queryForObject("SELECT COUNT(*) FROM practice_events WHERE user_id=?",Integer.class,uid));
    assertEquals(2,store.db().queryForObject("SELECT COUNT(*) FROM algorithms WHERE id IN ('stack','queue')",Integer.class));
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(600));
  }

  @Test void legacyAssignmentsRequireEveryCurrentOperationWithoutExtraRewards() throws Exception {
    String email="legacy.operations@example.test",token=bearer(register(email));
    String uid=store.db().queryForObject("SELECT id FROM app_users WHERE email=?",String.class,email);
    String teacher=store.db().queryForObject("SELECT id FROM app_users WHERE email='instructor@algoventure.edu'",String.class);
    var classroom=store.saveClass(teacher,null,new PortalDtos.Classroom("Legacy operations","","data-structures","basic"));
    String cid=(String)classroom.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",store.id(),cid,uid);
    var due=java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(7);
    for(String legacy:List.of("stack","queue")) {
      mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json")
          .content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId",legacy,"stage",1))))
          .andExpect(status().isBadRequest());
      var assignment=store.saveAssignment(teacher,null,new PortalDtos.Assignment(cid,"Legacy "+legacy,"","Active",due,List.of(legacy)));
      var expired=store.saveAssignment(teacher,null,new PortalDtos.Assignment(cid,"Expired "+legacy,"","Active",due.minusDays(8),List.of(legacy)));
      var required=Catalog.currentLessons(legacy);
      for(int index=0;index<required.size();index++) {
        var completion=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId",required.get(index),"stage",1);
        for(int retry=0;retry<2;retry++) mvc.perform(post("/api/game/me/completions").header("Authorization",token)
            .contentType("application/json").content(body(completion))).andExpect(status().isOk());
        assertEquals(index==2?1:0,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=? AND lesson_id=?",Integer.class,assignment.get("id"),uid,legacy));
        assertEquals(0,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=?",Integer.class,expired.get("id"),uid));
      }
      assertFalse(getState(token).path("completed").has(legacy));
    }
    assertEquals(6,store.db().queryForObject("SELECT COUNT(*) FROM practice_events WHERE user_id=?",Integer.class,uid));
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(600));
    @SuppressWarnings("unchecked") var students=(List<Map<String,Object>>)store.state(teacher).get("students");
    var learner=students.stream().filter(value->value.get("email").equals(email)).findFirst().orElseThrow();
    assertEquals(2,learner.get("completedLessons"));
    assertEquals(4,learner.get("assignedLessons"));
    assertEquals(50L,learner.get("progressPercent"));
  }

  @Test void publicRegistrationUsesSharedAccountsAndRevocableHashedSessions() throws Exception {
    var auth=register(" Learner.Shared@EXAMPLE.test "); String token=bearer(auth);
    assertTrue(auth.path("userId").asLong()>=1000000000L);
    assertEquals("learner.shared@example.test",auth.path("email").asText());
    assertEquals("learner",store.db().queryForObject("SELECT role FROM app_users WHERE email=?",String.class,"learner.shared@example.test"));
    assertNotEquals(auth.path("token").asText(),store.db().queryForObject("SELECT token_hash FROM learner_sessions",String.class));
    // PostgreSQL aborts a transaction after a unique violation. This test wraps
    // multiple HTTP requests in one rollback-only transaction, unlike production.
    var duplicateSavepoint = store.db().execute((org.springframework.jdbc.core.ConnectionCallback<java.sql.Savepoint>) c -> c.setSavepoint());
    try {
      mvc.perform(post("/api/game/auth/register").contentType("application/json").content(body(Map.of("email","learner.shared@example.test","password","Learner@12345","fullName","Duplicate")))).andExpect(status().isConflict());
    } finally {
      store.db().execute((org.springframework.jdbc.core.ConnectionCallback<Void>) c -> { c.rollback(duplicateSavepoint); c.releaseSavepoint(duplicateSavepoint); return null; });
    }
    mvc.perform(get("/api/game/auth/me").header("Authorization",token)).andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(auth.path("userId").asLong()));
    mvc.perform(get("/api/admin/users").header("Authorization",token)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/game/auth/logout").header("Authorization",token)).andExpect(status().isNoContent());
    mvc.perform(get("/api/learner/classes").header("Authorization",token)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/game/auth/login").contentType("application/json").content(body(Map.of("email","learner.shared@example.test","password","Learner@12345")))).andExpect(status().isOk());
  }
  @Test void validationAndRoleChangesAreEnforcedByServer() throws Exception {
    mvc.perform(post("/api/game/auth/register").contentType("application/json").content(body(Map.of("email","invalid","password","x","fullName","")))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/game/auth/login").contentType("application/json").content(body(Map.of("email","admin@algoventure.edu","password","Admin@Test123")))).andExpect(status().isForbidden());
    var auth=register("suspended.shared@example.test");
    store.db().update("UPDATE app_users SET status='Suspended' WHERE email=?","suspended.shared@example.test");
    mvc.perform(get("/api/game/me/state").header("Authorization",bearer(auth))).andExpect(status().isForbidden());
    store.db().update("UPDATE app_users SET status='Active',role='instructor' WHERE email=?","suspended.shared@example.test");
    mvc.perform(get("/api/learner/classes").header("Authorization",bearer(auth))).andExpect(status().isForbidden());
  }
  @Test void constructionRequiresThreeOrderedStagesAndAwardsOneLessonScore() throws Exception {
    String token=bearer(register("construction.shared@example.test"));
    var first=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-list","stage",1);
    var second=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-list","stage",2);
    var third=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-list","stage",3);
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(second))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(first)))
      .andExpect(status().isOk()).andExpect(jsonPath("$.completed['linked-list']").doesNotExist()).andExpect(jsonPath("$.linkedLevels['linked-list'][0]").value(1));
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(0));
    // A stage needs its own attempt ID; retrying the same completed stage is safe.
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",first.get("clientAttemptId"),"lessonId","linked-list","stage",2)))).andExpect(status().isBadRequest());
    for(int i=0;i<2;i++) mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(second)))
      .andExpect(status().isOk()).andExpect(jsonPath("$.completed['linked-list']").doesNotExist());
    assertEquals(2,getState(token).path("profile").path("history").size());
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(0));
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(third)))
      .andExpect(status().isOk()).andExpect(jsonPath("$.completed['linked-list']").value(true));
    assertTrue(getState(token).path("completed").path("linked-list").asBoolean());
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(100));
    String uid=store.db().queryForObject("SELECT id FROM app_users WHERE email='construction.shared@example.test'",String.class);
    String teacher=store.db().queryForObject("SELECT id FROM app_users WHERE email='instructor@algoventure.edu'",String.class);
    var classroom=store.saveClass(teacher,null,new PortalDtos.Classroom("Linked stages","","data-structures","basic"));
    String classId=(String)classroom.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",store.id(),classId,uid);
    var assignment=store.saveAssignment(teacher,null,new PortalDtos.Assignment(classId,"Traversal","","Active",java.time.LocalDate.now().plusDays(7),List.of("linked-traversal")));
    var traversalFirst=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-traversal","stage",1);
    var traversalSecond=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-traversal","stage",2);
    var traversalThird=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-traversal","stage",3);
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(traversalThird)))
      .andExpect(status().isBadRequest());
    for(var stage:List.of(traversalFirst,traversalSecond)) {
      mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(stage)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.completed['linked-traversal']").doesNotExist());
      assertEquals(0,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=?",Integer.class,assignment.get("id"),uid));
    }
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json")
        .content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linked-search","stage",1))))
      .andExpect(status().isBadRequest());
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(traversalThird)))
      .andExpect(status().isOk()).andExpect(jsonPath("$.completed['linked-traversal']").value(true));
    assertEquals(1,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=?",Integer.class,assignment.get("id"),uid));
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(200));
  }

  @Test void gameStateIsPersistentIsolatedAndCompletionRetriesAreIdempotent() throws Exception {
    String token=bearer(register("progress.shared@example.test"));
    String other=bearer(register("other.shared@example.test"));
    assertTrue(getState(token).path("completed").isEmpty());
    mvc.perform(put("/api/game/me/profile").header("Authorization",token).contentType("application/json").content(body(Map.of("name","Tên mới","avatar","buta")))).andExpect(status().isOk()).andExpect(jsonPath("$.profile.name").value("Tên mới"));
    var completion=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","linear","stage",1);
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","selection","stage",1)))).andExpect(status().isBadRequest());
    for(int i=0;i<2;i++) mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(completion))).andExpect(status().isOk()).andExpect(jsonPath("$.completed.linear").value(true));
    assertEquals(1,getState(token).path("profile").path("history").size());
    assertTrue(getState(other).path("completed").isEmpty());
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(100));
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",completion.get("clientAttemptId"),"lessonId","bubble","stage",1)))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","nonexistent","stage",1)))).andExpect(status().isNotFound());
  }
}
