package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.*;
import java.util.*;
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
  JsonNode register(String email) throws Exception {
    return json.readTree(mvc.perform(post("/api/game/auth/register").contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password","Learner@12345","fullName","New Learner","role","admin","status","Suspended"))))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("LEARNER")).andExpect(jsonPath("$.password_hash").doesNotExist()).andReturn().getResponse().getContentAsString());
  }
  String bearer(JsonNode auth) { return "Bearer "+auth.path("token").asText(); }
  JsonNode getState(String token) throws Exception { return json.readTree(mvc.perform(get("/api/game/me/state").header("Authorization",token)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()); }
  String body(Object v) throws Exception { return json.writeValueAsString(v); }

  @Test void publicRegistrationUsesSharedAccountsAndRevocableHashedSessions() throws Exception {
    var auth=register(" Learner.Shared@EXAMPLE.test "); String token=bearer(auth);
    assertTrue(auth.path("userId").asLong()>=1000000000L);
    assertEquals("learner.shared@example.test",auth.path("email").asText());
    assertEquals("learner",store.db().queryForObject("SELECT role FROM app_users WHERE email=?",String.class,"learner.shared@example.test"));
    assertNotEquals(auth.path("token").asText(),store.db().queryForObject("SELECT token_hash FROM learner_sessions",String.class));
    mvc.perform(post("/api/game/auth/register").contentType("application/json").content(body(Map.of("email","learner.shared@example.test","password","Learner@12345","fullName","Duplicate")))).andExpect(status().isConflict());
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
  @Test void gameStateIsPersistentIsolatedAndCompletionRetriesAreIdempotent() throws Exception {
    String token=bearer(register("progress.shared@example.test"));
    String other=bearer(register("other.shared@example.test"));
    assertTrue(getState(token).path("completed").isEmpty());
    mvc.perform(put("/api/game/me/profile").header("Authorization",token).contentType("application/json").content(body(Map.of("name","Tên mới","avatar","buta")))).andExpect(status().isOk()).andExpect(jsonPath("$.profile.name").value("Tên mới"));
    var completion=Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","bubble","stage",1);
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","selection","stage",1)))).andExpect(status().isBadRequest());
    for(int i=0;i<2;i++) mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(completion))).andExpect(status().isOk()).andExpect(jsonPath("$.completed.bubble").value(true));
    assertEquals(1,getState(token).path("profile").path("history").size());
    assertTrue(getState(other).path("completed").isEmpty());
    mvc.perform(get("/api/game/leaderboard").header("Authorization",token).param("period","all-time")).andExpect(status().isOk()).andExpect(jsonPath("$.player.score").value(100));
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",completion.get("clientAttemptId"),"lessonId","linear","stage",1)))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(body(Map.of("clientAttemptId",UUID.randomUUID(),"lessonId","nonexistent","stage",1)))).andExpect(status().isNotFound());
  }
}
