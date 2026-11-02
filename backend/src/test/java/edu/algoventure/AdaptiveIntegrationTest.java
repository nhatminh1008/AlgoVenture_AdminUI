package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class AdaptiveIntegrationTest {
  @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired PortalStore store;
  @Autowired UserStore users; @Autowired PracticeCatalog catalog;
  @MockitoBean AdaptiveGateway gateway;

  String register(String name) throws Exception {
    var result=mvc.perform(post("/api/game/auth/register").contentType("application/json").content(json.writeValueAsString(Map.of("email",name+"@example.test","password","Learner@12345","fullName","Practice Learner")))).andExpect(status().isCreated()).andReturn();
    return "Bearer "+json.readTree(result.getResponse().getContentAsString()).path("token").asText();
  }
  Map<String,Object> uploadValue(List<Integer> input,List<Map<String,Object>> events) {
    return new LinkedHashMap<>(Map.of("schemaVersion",1,"engineVersion","bubble-v1","lessonId","bubble","mode","play","source","map","difficulty","easy","input",input,"startedAt","2026-11-02T00:00:00Z","events",events));
  }
  Map<String,Object> move(BubbleTrace trace,int sequence,int item,int target) {
    var event=new LinkedHashMap<String,Object>(Map.of("eventId",UUID.randomUUID(),"sequence",sequence,"kind","move","elapsedMs",sequence*100,"occurredAt","2026-11-02T00:00:01Z","itemId",item,"targetIndex",target,"inputMethod","keyboard","before",trace.snapshot()));
    trace.move(item,target); return event;
  }
  void upload(String token,UUID id,Map<String,Object> value) throws Exception {
    mvc.perform(put("/api/game/me/learning-attempts/"+id).header("Authorization",token).contentType("application/json").content(json.writeValueAsString(value))).andExpect(status().isOk());
  }
  JsonNode recommend(String token,UUID requestId) throws Exception {
    return json.readTree(mvc.perform(post("/api/game/me/practice/recommendations").header("Authorization",token).contentType("application/json").content(json.writeValueAsString(Map.of("clientRequestId",requestId)))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
  }

  @Test void catalogRequiresLearnerAndRespectsPublishedStateAndPrerequisites() throws Exception {
    String token=register("practice.catalog");
    mvc.perform(get("/api/game/me/practice/exercises")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/game/me/practice/exercises").header("Authorization",token)).andExpect(jsonPath("$.exercises.length()").value(3));
    mvc.perform(get("/api/game/me/practice/exercises?assignmentId="+UUID.randomUUID()).header("Authorization",token)).andExpect(status().isNotFound());
    store.db().update("UPDATE algorithms SET status='Draft' WHERE id='bubble'");
    mvc.perform(get("/api/game/me/practice/exercises").header("Authorization",token)).andExpect(jsonPath("$.exercises.length()").value(0));
    @SuppressWarnings("unchecked") var config=(Map<String,Object>)store.decode(store.db().queryForObject("SELECT config FROM algorithms WHERE id='bubble'",String.class));
    config.put("prerequisites",List.of("selection"));
    store.db().update("UPDATE algorithms SET status='Published',config=? WHERE id='bubble'",store.encode(config));
    mvc.perform(get("/api/game/me/practice/exercises").header("Authorization",token)).andExpect(jsonPath("$.exercises.length()").value(0));
    store.db().update("INSERT INTO lesson_completions(id,user_id,lesson_id,stage) VALUES (?,?,?,?)",store.id(),users.byEmail("practice.catalog@example.test").id(),"selection",1);
    mvc.perform(get("/api/game/me/practice/exercises").header("Authorization",token)).andExpect(jsonPath("$.exercises.length()").value(3));
  }

  @Test void insufficientHistoryDoesNotInventPredictionsAndRetriesAreIdempotent() throws Exception {
    String token=register("practice.empty"); UUID request=UUID.randomUUID();
    var first=recommend(token,request);
    assertEquals("insufficient_history",first.path("status").asText());
    assertTrue(first.path("predictedCorrectness").isNull());
    assertEquals(first,recommend(token,request));
    assertEquals(1,store.db().queryForObject("SELECT COUNT(*) FROM adaptive_recommendations",Integer.class));
    verifyNoInteractions(gateway);
  }

  @Test void experimentalRecommendationKeepsHistoryDisclosureAndRetryProvenance() throws Exception {
    String token=register("practice.experimental");
    var trace=new BubbleTrace(List.of(3,1,2));
    upload(token,UUID.randomUUID(),uploadValue(List.of(3,1,2),List.of(move(trace,1,1,0))));
    when(gateway.recommend(any())).thenReturn(new AdaptiveGateway.Result("ready","bubble-short-v1",.68,
        "bubble-experimental-test","target-correctness-v1:0.70","experimental_target_correctness",1,0));
    UUID request=UUID.randomUUID();
    var result=recommend(token,request);
    assertEquals("experimental_target_correctness",result.path("reasonCode").asText());
    assertEquals(1,result.path("historyUsed").asInt());
    assertEquals(0,result.path("historySkipped").asInt());
    assertEquals(result,recommend(token,request));
    verify(gateway,times(1)).recommend(any());
  }

  @Test void recommendationUsesOnlyFirstResponsesAndSupplementaryPracticeKeepsItsProvenance() throws Exception {
    String token=register("practice.full"); UUID original=UUID.randomUUID();
    var trace=new BubbleTrace(List.of(3,1,2));
    var events=List.of(move(trace,1,2,1),move(trace,2,1,0),move(trace,3,2,1));
    upload(token,original,uploadValue(List.of(3,1,2),events));
    var oldMetadata=store.db().queryForObject("SELECT metadata FROM learning_attempts WHERE client_attempt_id=?",String.class,original.toString());
    assertFalse(json.readTree(oldMetadata).has("activity")); // Old snapshots keep the exact legacy shape.
    when(gateway.recommend(any())).thenReturn(new AdaptiveGateway.Result("ready","bubble-short-v1",0.72,"game-validated-test","target-correctness-v1:0.70","target_correctness"));
    var result=recommend(token,UUID.randomUUID());
    var capture=ArgumentCaptor.forClass(AdaptiveGateway.Request.class); verify(gateway).recommend(capture.capture());
    assertEquals(List.of(0,1),capture.getValue().history().stream().map(AdaptiveGateway.Observation::response).toList());
    assertEquals(3,capture.getValue().candidates().size());
    var exercise=catalog.get("bubble-short-v1");
    var value=uploadValue(exercise.input(),List.of()); value.put("activity","supplementary"); value.put("exerciseId",exercise.id()); value.put("recommendationId",result.path("id").asText());
    UUID supplementary=UUID.randomUUID(); upload(token,supplementary,value); upload(token,supplementary,value);
    var read=json.readTree(mvc.perform(get("/api/game/me/learning-attempts/"+supplementary).header("Authorization",token)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    assertEquals("supplementary",read.path("metadata").path("activity").asText());
    assertEquals(result.path("id"),read.path("metadata").path("recommendationId"));
    String other=register("practice.other");
    mvc.perform(put("/api/game/me/learning-attempts/"+UUID.randomUUID()).header("Authorization",other).contentType("application/json").content(json.writeValueAsString(value))).andExpect(status().isNotFound());
    value.put("input",List.of(9,8));
    mvc.perform(put("/api/game/me/learning-attempts/"+UUID.randomUUID()).header("Authorization",token).contentType("application/json").content(json.writeValueAsString(value))).andExpect(status().isBadRequest());
  }

  @Test void instructorSeesOnlyEvidenceAttachedToTheirClass() throws Exception {
    String token=register("practice.class"); String uid=users.byEmail("practice.class@example.test").id();
    String teacher=users.byEmail("instructor@algoventure.edu").id();
    var classroom=store.saveClass(teacher,null,new PortalDtos.Classroom("Practice class","","sorting","basic"));
    String cid=(String)classroom.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",store.id(),cid,uid);
    var assignment=store.saveAssignment(teacher,null,new PortalDtos.Assignment(cid,"Bubble practice","","Active",LocalDate.now().plusDays(7),List.of("bubble")));
    var trace=new BubbleTrace(List.of(3,1,2));
    var value=uploadValue(List.of(3,1,2),List.of(move(trace,1,1,0))); value.put("source","classroom"); value.put("assignmentId",assignment.get("id"));
    upload(token,UUID.randomUUID(),value);
    upload(token,UUID.randomUUID(),uploadValue(List.of(3,1,2),List.of())); // Free practice is excluded.
    mvc.perform(get("/api/instructor/classes/"+cid+"/practice").with(user("instructor@algoventure.edu").roles("INSTRUCTOR")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.students[0].minigameAttempts").value(1))
        .andExpect(jsonPath("$.students[0].observations").value(1)).andExpect(jsonPath("$.students[0].correctFirstResponses").value(1));
    mvc.perform(get("/api/instructor/classes/"+UUID.randomUUID()+"/practice").with(user("instructor@algoventure.edu").roles("INSTRUCTOR"))).andExpect(status().isNotFound());
  }
}
