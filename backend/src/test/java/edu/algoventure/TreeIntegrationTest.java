package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.time.*;
import java.util.*;
import org.flywaydb.core.api.migration.Context;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class TreeIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired PortalStore store;

  String learner(String email) throws Exception {
    var result = mvc.perform(post("/api/game/auth/register").contentType("application/json")
        .content(json.writeValueAsString(Map.of("email", email, "password", "Learner@Test123", "fullName", "Tree Learner"))))
        .andExpect(status().isCreated()).andReturn();
    return "Bearer " + json.readTree(result.getResponse().getContentAsString()).path("token").asText();
  }
  String uid(String email) {
    return store.db().queryForObject("SELECT id FROM app_users WHERE email=?", String.class, email);
  }
  String classroom(String uid, String topic) {
    String owner = uid("instructor@algoventure.edu");
    var classroom = store.saveClass(owner, null, new PortalDtos.Classroom("Tree QA", "", topic, "basic"));
    String cid = (String) classroom.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)", store.id(), cid, uid);
    return cid;
  }
  org.springframework.test.web.servlet.ResultActions complete(String token, String lesson) throws Exception {
    return mvc.perform(post("/api/game/me/completions").header("Authorization", token).contentType("application/json")
        .content(json.writeValueAsString(Map.of("clientAttemptId", UUID.randomUUID(), "lessonId", lesson, "stage", 1))));
  }
  JsonNode state(String token) throws Exception {
    return json.readTree(mvc.perform(get("/api/game/me/state").header("Authorization", token))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
  }
  void migration() throws Exception {
    var context = org.mockito.Mockito.mock(Context.class);
    org.mockito.Mockito.when(context.getConnection()).thenReturn(DataSourceUtils.getConnection(store.db().getDataSource()));
    new db.migration.V10__Split_tree_traversal().migrate(context);
  }
  void oldAlgorithm(String id, String config) {
    store.db().update("INSERT INTO algorithms(id,topic_id,name,difficulty,status,config) VALUES (?,'data-structures',?,'Medium','Published',?)", id, id, config);
  }
  void completion(String uid, String lesson) {
    store.db().update("INSERT INTO lesson_completions(id,user_id,lesson_id,stage) VALUES (?,?,?,1)", store.id(), uid, lesson);
  }
  int assignedCount(String aid) {
    return store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=?", Integer.class, aid);
  }
  int score(String token) throws Exception {
    store.db().update("UPDATE feature_toggles SET enabled=true WHERE id='leaderboard'");
    return json.readTree(mvc.perform(get("/api/game/leaderboard").param("period", "all-time").header("Authorization", token))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("player").path("score").asInt();
  }

  @Test void newLearnerCompletesTheCurrentTreeRouteAndInstructorReceivesResults() throws Exception {
    String token = learner("new.tree@example.test"), uid = uid("new.tree@example.test");
    String cid = classroom(uid, "data-structures");
    var ids = List.of("tree-basics", "tree-dfs", "tree-bfs", "bst-search", "bst-insert", "bst-delete");
    var assignment = store.saveAssignment(uid("instructor@algoventure.edu"), null,
        new PortalDtos.Assignment(cid, "Trees", "", "Active", LocalDate.now().plusDays(7), ids));
    complete(token, "tree-dfs").andExpect(status().isBadRequest());
    complete(token, "bst-search").andExpect(status().isBadRequest());
    complete(token, "tree-basics").andExpect(status().isOk());
    complete(token, "tree-bfs").andExpect(status().isBadRequest());
    for (String id : ids.subList(1, ids.size())) complete(token, id).andExpect(status().isOk());
    var current = state(token);
    for (String id : ids) assertTrue(current.path("completed").path(id).asBoolean(), id);
    Set<String> rules = new HashSet<>();
    current.path("lessonRules").forEach(rule -> rules.add(rule.path("id").asText()));
    assertEquals(29, rules.size());
    assertFalse(rules.contains("tree-traversal")); assertFalse(rules.contains("bst"));
    assertEquals(6, assignedCount((String) assignment.get("id")));
    assertEquals(100L, store.student("enrollment", uid, cid, "Tree", "test").get("progressPercent"));
    assertEquals(600, score(token));
    for (String retired : List.of("tree-traversal", "bst")) {
      complete(token, retired).andExpect(status().isNotFound());
      assertThrows(ApiException.class, () -> store.saveAssignment(uid("instructor@algoventure.edu"), null,
          new PortalDtos.Assignment(cid, "Retired", "", "Draft", null, List.of(retired))));
    }
  }

  @Test void migrationPreservesLegacyProgressScoresEvidenceAndPublication() throws Exception {
    String token = learner("old.tree@example.test"), uid = uid("old.tree@example.test");
    String cid = classroom(uid, "data-structures"), aid = store.id(), removed = store.id();
    store.db().update("DELETE FROM algorithms WHERE id IN ('tree-dfs','tree-bfs')");
    String config = store.encode(Map.of("prerequisites", List.of("tree-basics"), "timeLimit", 120, "hintsAllowed", false, "starThresholds", List.of(10,20,30)));
    oldAlgorithm("tree-traversal", config); oldAlgorithm("bst", config);
    store.db().update("UPDATE algorithms SET status='Draft' WHERE id='tree-traversal'");
    for (String id : List.of("tree-basics", "tree-traversal", "bst")) completion(uid, id);
    store.db().update("UPDATE algorithms SET config=? WHERE id='bst-search'", store.encode(Map.of("prerequisites", List.of("tree-traversal", "bst"))));
    for (String id : List.of(aid, removed))
      store.db().update("INSERT INTO assignments(id,class_id,title,description,status,due,lesson_ids,lesson_configs) VALUES (?,?,?,'','Active',?,?,?)",
          id, cid, id, LocalDate.now().plusDays(7), store.encode(id.equals(aid) ? List.of("tree-traversal", "bst") : List.of("bst")), "{}");
    OffsetDateTime at = OffsetDateTime.parse("2026-01-02T03:04:05Z");
    store.db().update("INSERT INTO assignment_completions(assignment_id,user_id,lesson_id,completed_at) VALUES (?,?,'tree-traversal',?)", aid, uid, at);
    int oldScore = score(token);
    migration(); migration();
    assertEquals(List.of("tree-dfs", "tree-bfs"), store.decode(store.db().queryForObject("SELECT lesson_ids FROM assignments WHERE id=?", String.class, aid)));
    assertEquals("Closed", store.db().queryForObject("SELECT status FROM assignments WHERE id=?", String.class, removed));
    for (String id : List.of("tree-dfs", "tree-bfs")) {
      assertEquals("Draft", store.db().queryForObject("SELECT status FROM algorithms WHERE id=?", String.class, id));
      assertEquals(config, store.db().queryForObject("SELECT config FROM algorithms WHERE id=?", String.class, id));
      assertEquals(at.toInstant(), store.db().queryForObject("SELECT completed_at FROM assignment_completions WHERE assignment_id=? AND user_id=? AND lesson_id=?", OffsetDateTime.class, aid, uid, id).toInstant());
    }
    var prerequisiteConfig = (Map<?,?>) store.decode(store.db().queryForObject("SELECT config FROM algorithms WHERE id='bst-search'", String.class));
    assertEquals(List.of("tree-dfs", "tree-bfs"), prerequisiteConfig.get("prerequisites"));
    assertEquals(oldScore, score(token));
    var progress = state(token).path("completed");
    assertTrue(progress.path("tree-dfs").asBoolean()); assertTrue(progress.path("tree-bfs").asBoolean());
    assertFalse(progress.has("bst")); assertFalse(progress.has("tree-traversal"));
    assertEquals(100L, store.student("enrollment", uid, cid, "Old Tree", "test").get("progressPercent"));
    mvc.perform(get("/api/learner/assignments/" + aid).header("Authorization", token)).andExpect(status().isOk())
        .andExpect(jsonPath("$.completedLessonIds.length()").value(2));
    // Replaying an inherited completion must not create another leaderboard reward.
    store.db().update("UPDATE algorithms SET status='Published' WHERE id IN ('tree-dfs','tree-bfs')");
    complete(token, "tree-dfs").andExpect(status().isOk());
    complete(token, "tree-bfs").andExpect(status().isOk());
    assertEquals(oldScore, score(token));
    assertEquals(3, store.db().queryForObject("SELECT COUNT(*) FROM lesson_completions WHERE user_id=?", Integer.class, uid));
    complete(token, "bst-search").andExpect(status().isOk());
  }

  @Test void migrationKeepsExplicitNewLessonConfiguration() throws Exception {
    String config = store.encode(Map.of("prerequisites", List.of("tree-basics")));
    oldAlgorithm("tree-traversal", config);
    store.db().update("UPDATE algorithms SET status='Draft',config=? WHERE id='tree-dfs'", config);
    migration();
    assertEquals("Draft", store.db().queryForObject("SELECT status FROM algorithms WHERE id='tree-dfs'", String.class));
    assertEquals(config, store.db().queryForObject("SELECT config FROM algorithms WHERE id='tree-dfs'", String.class));
  }

  @Test void freeCompletionDoesNotCompleteCustomOrExpiredAssignments() throws Exception {
    String token = learner("custom.isolation@example.test"), uid = uid("custom.isolation@example.test");
    String cid = classroom(uid, "sorting"), owner = uid("instructor@algoventure.edu");
    completion(uid, "bubble");
    String regular = (String) store.saveAssignment(owner, null, new PortalDtos.Assignment(cid, "Regular", "", "Active", LocalDate.now().plusDays(7), List.of("selection"))).get("id");
    String custom = (String) store.saveAssignment(owner, null, new PortalDtos.Assignment(cid, "Custom", "", "Active", LocalDate.now().plusDays(7), List.of("selection"), Map.of("selection", new PortalDtos.LessonConfig(60, "easy", List.of(2,1))))).get("id");
    String expired = (String) store.saveAssignment(owner, null, new PortalDtos.Assignment(cid, "Expired", "", "Active", LocalDate.now().minusDays(1), List.of("selection"))).get("id");
    complete(token, "selection").andExpect(status().isOk());
    assertEquals(1, assignedCount(regular)); assertEquals(0, assignedCount(custom)); assertEquals(0, assignedCount(expired));
    mvc.perform(post("/api/game/me/completions").header("Authorization", token).contentType("application/json")
        .content(json.writeValueAsString(Map.of("clientAttemptId", UUID.randomUUID(), "lessonId", "selection", "stage", 1, "assignmentId", custom))))
        .andExpect(status().isOk());
    assertEquals(1, assignedCount(custom)); assertEquals(0, assignedCount(expired));
  }
}
