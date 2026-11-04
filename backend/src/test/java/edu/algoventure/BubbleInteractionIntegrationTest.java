package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class BubbleInteractionIntegrationTest {
  @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired PortalStore store;
  String register(String name) throws Exception {
    var result=mvc.perform(post("/api/game/auth/register").contentType("application/json").content(json.writeValueAsString(Map.of("email",name+"@example.test","password","Learner@12345","fullName","Log Learner")))).andExpect(status().isCreated()).andReturn();
    return "Bearer "+json.readTree(result.getResponse().getContentAsString()).path("token").asText();
  }
  Map<String,Object> header(List<Integer> input,List<Map<String,Object>> events) {
    var value=new LinkedHashMap<String,Object>();
    value.putAll(Map.of("schemaVersion",1,"engineVersion","bubble-v1","lessonId","bubble","mode","play","source","map","difficulty","easy","input",input,"startedAt","2026-11-02T00:00:00Z","events",events));
    return value;
  }
  Map<String,Object> event(int sequence,String kind,int elapsed) {
    return new LinkedHashMap<>(Map.of("eventId",UUID.randomUUID(),"sequence",sequence,"kind",kind,"elapsedMs",elapsed,"occurredAt","2026-11-02T00:00:01Z"));
  }
  Map<String,Object> move(BubbleTrace trace,int seq,int item,int target) {
    var e=event(seq,"move",seq*100);
    e.putAll(Map.of("itemId",item,"targetIndex",target,"inputMethod","keyboard","before",trace.snapshot()));
    trace.move(item,target); return e;
  }
  org.springframework.test.web.servlet.ResultActions upload(String token,UUID id,Map<String,Object> value) throws Exception {
    return mvc.perform(put("/api/game/me/learning-attempts/"+id).header("Authorization",token).contentType("application/json").content(json.writeValueAsString(value)));
  }
  JsonNode read(String token,UUID id,String suffix) throws Exception {
    return json.readTree(mvc.perform(get("/api/game/me/learning-attempts/"+id+suffix).header("Authorization",token)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
  }

  @Test void assignedBubbleUsesTeacherInputClockAndIsolatedCompletion() throws Exception {
    String token=register("bubble.custom"), stranger=register("bubble.custom-other");
    String owner=store.db().queryForObject("SELECT id FROM app_users WHERE email='instructor@algoventure.edu'",String.class);
    String uid=store.db().queryForObject("SELECT id FROM app_users WHERE email='bubble.custom@example.test'",String.class);
    var c=store.saveClass(owner,null,new PortalDtos.Classroom("Custom","","sorting","basic"));
    var a=store.saveAssignment(owner,null,new PortalDtos.Assignment((String)c.get("id"),"Custom","","Active",LocalDate.now().plusDays(1),List.of("bubble"),Map.of("bubble",new PortalDtos.LessonConfig(60,"easy",List.of(3,-1,2)))));
    String assignment=(String)a.get("id");
    store.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",store.id(),c.get("id"),uid);
    mvc.perform(post("/api/game/me/bubble-challenges").param("assignmentId",assignment).header("Authorization",stranger)).andExpect(status().isNotFound());
    mvc.perform(get("/api/learner/assignments/"+assignment).header("Authorization",token)).andExpect(status().isOk()).andExpect(jsonPath("$.lessonConfigs.bubble.timeLimitSeconds").value(60));
    var issued=json.readTree(mvc.perform(post("/api/game/me/bubble-challenges").param("assignmentId",assignment).header("Authorization",token)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    UUID id=UUID.fromString(issued.path("clientAttemptId").asText());
    assertEquals(json.valueToTree(List.of(3,-1,2)),issued.path("input"));
    var trace=new BubbleTrace(List.of(3,-1,2)); var events=new ArrayList<Map<String,Object>>();
    while(!trace.done) events.add(move(trace,events.size()+1,trace.items.get(trace.pair).id(),trace.pair+1));
    events.add(event(events.size()+1,"completed",1000));
    var log=header(List.of(3,-1,2),events); log.put("source","classroom");log.put("assignmentId",assignment);
    upload(token,id,log).andExpect(status().isOk());
    var claim=Map.of("clientAttemptId",id,"lessonId","bubble","stage",1,"assignmentId",assignment);
    for(int i=0;i<2;i++) mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(json.writeValueAsString(claim))).andExpect(status().isOk()).andExpect(jsonPath("$.completed.bubble").doesNotExist());
    assertEquals(1,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=?",Integer.class,assignment));
    mvc.perform(post("/api/game/me/completions").header("Authorization",token).contentType("application/json").content(json.writeValueAsString(Map.of("clientAttemptId",id,"lessonId","bubble","stage",1)))).andExpect(status().isBadRequest());
    var timeout=json.readTree(mvc.perform(post("/api/game/me/bubble-challenges").param("assignmentId",assignment).header("Authorization",token)).andReturn().getResponse().getContentAsString());
    var end=event(1,"timed_out",60000);end.put("reason","timeout");
    var timeoutLog=header(List.of(3,-1,2),List.of(end));timeoutLog.put("source","classroom");timeoutLog.put("assignmentId",assignment);
    upload(token,UUID.fromString(timeout.path("clientAttemptId").asText()),timeoutLog).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("timed_out"));
  }

  @Test void completionRequiresTheOwnersReplayedHardAttempt() throws Exception {
    String owner=register("bubble.credit"), other=register("bubble.other-credit");
    var issued=json.readTree(mvc.perform(post("/api/game/me/bubble-challenges").header("Authorization",owner))
      .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    UUID id=UUID.fromString(issued.path("clientAttemptId").asText());
    var body=json.writeValueAsString(Map.of("lessonId","bubble","stage",1,"clientAttemptId",id));
    var claim=post("/api/game/me/completions").contentType("application/json").content(body);
    mvc.perform(claim.header("Authorization",owner)).andExpect(status().isBadRequest());
    var altered=header(List.of(2,1,3,4,5,6,7,8),List.of());
    altered.put("difficulty","hard");
    upload(owner,id,altered).andExpect(status().isBadRequest());
    upload(other,id,altered).andExpect(status().isNotFound());
    var input=new ArrayList<Integer>();
    issued.path("input").forEach(value -> input.add(value.asInt()));
    var trace=new BubbleTrace(input);
    var events=new ArrayList<Map<String,Object>>();
    while(!trace.done) events.add(move(trace,events.size()+1,trace.items.get(trace.pair).id(),trace.pair+1));
    assertTrue(events.size()>=8);
    events.add(event(events.size()+1,"completed",(events.size()+1)*100));
    var log=header(input,events);
    log.put("difficulty","hard");
    upload(owner,id,log).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("completed"));
    mvc.perform(post("/api/game/me/completions").header("Authorization",other).contentType("application/json").content(body))
      .andExpect(status().isBadRequest());
    for(int i=0;i<2;i++) mvc.perform(claim).andExpect(status().isOk()).andExpect(jsonPath("$.completed.bubble").value(true));
    assertEquals(1,store.db().queryForObject("SELECT COUNT(*) FROM practice_events WHERE client_id=?",Integer.class,id.toString()));
  }

  @Test void preservesWrongDecisionsReplaysAndDeduplicatesPrefixesWithoutFakeMastery() throws Exception {
    String token=register("bubble.logs"); UUID id=UUID.randomUUID();
    var input=List.of(3,1,2); var trace=new BubbleTrace(input); var events=new ArrayList<Map<String,Object>>();
    var h=header(input,events);
    upload(token,id,h).andExpect(status().isOk()).andExpect(jsonPath("$.acknowledgedSequence").value(0));
    events.add(move(trace,1,2,1)); // Wrong pair, leaves the board intact.
    upload(token,id,h).andExpect(status().isOk());
    events.add(move(trace,2,1,0)); // Retry of the same opportunity.
    events.add(move(trace,3,2,1));
    events.add(event(4,"completed",400));
    for(int i=0;i<2;i++) upload(token,id,h).andExpect(status().isOk()).andExpect(jsonPath("$.acknowledgedSequence").value(4)).andExpect(jsonPath("$.status").value("completed"));
    // A delayed shorter request can acknowledge, never rewind an accepted tail.
    upload(token,id,header(input,events.subList(0,1))).andExpect(status().isOk()).andExpect(jsonPath("$.acknowledgedSequence").value(4));
    var raw=read(token,id,"");
    assertFalse(raw.path("receivedAt").asText().isBlank());
    assertEquals(4,raw.path("events").size());
    assertFalse(raw.path("events").get(0).path("evaluation").path("correct").asBoolean());
    assertEquals(raw.path("events").get(0).path("evaluation").path("before"),raw.path("events").get(0).path("evaluation").path("after"));
    var observations=read(token,id,"/observations");
    assertEquals(3,observations.path("decisions").asInt());
    assertEquals(1,observations.path("retryDecisions").asInt());
    assertEquals(2,observations.path("observations").size());
    assertFalse(observations.path("observations").get(0).path("receivedAt").asText().isBlank());
    assertEquals(0,observations.path("observations").get(0).path("response").asInt());
    assertEquals(1,observations.path("observations").get(1).path("response").asInt());
    assertEquals("checkpoint_not_configured",observations.path("modelStatus").asText());
    assertTrue(observations.path("mastery").isNull());
    assertEquals(0,store.db().queryForObject("SELECT COUNT(*) FROM practice_events",Integer.class));
  }
  @Test void rejectsChangedMetadataEventsGapsAndImpossibleCompletionsAtomically() throws Exception {
    String token=register("bubble.invalid"); UUID id=UUID.randomUUID();
    var input=List.of(3,1,2); var trace=new BubbleTrace(input);
    var e=move(trace,1,1,0); var h=header(input,List.of(e));
    upload(token,id,h).andExpect(status().isOk());
    var different=header(List.of(4,1,2),List.of(e));
    upload(token,id,different).andExpect(status().isConflict());
    var changed=new LinkedHashMap<>(e); changed.put("inputMethod","touch");
    upload(token,id,header(input,List.of(changed))).andExpect(status().isConflict());
    var gap=event(3,"completed",300);
    upload(token,id,header(input,List.of(e,gap))).andExpect(status().isBadRequest());
    var falseFinish=event(2,"completed",200);
    upload(token,id,header(input,List.of(e,falseFinish))).andExpect(status().isBadRequest());
    assertEquals(1,read(token,id,"").path("eventCount").asInt());
  }
  @Test void rejectsStateDriftNonDecisionsAndNonPlayModes() throws Exception {
    String token=register("bubble.drift"); var input=List.of(3,1,2);
    var trace=new BubbleTrace(input); var move=move(trace,1,1,0);
    move.put("before",trace.snapshot());
    UUID id=UUID.randomUUID();
    upload(token,id,header(input,List.of(move))).andExpect(status().isBadRequest());
    var self=event(1,"move",100); self.putAll(Map.of("itemId",0,"targetIndex",0,"inputMethod","mouse","before",new BubbleTrace(input).snapshot()));
    upload(token,id,header(input,List.of(self))).andExpect(status().isBadRequest());
    var demo=header(input,List.of()); demo.put("mode","demo");
    upload(token,id,demo).andExpect(status().isBadRequest());
    mvc.perform(get("/api/game/me/learning-attempts/"+id).header("Authorization",token)).andExpect(status().isNotFound());
  }
  @Test void recordsLifecycleAndKeepsAutomaticSortedRunsOutOfObservations() throws Exception {
    String token=register("bubble.lifecycle"); UUID sorted=UUID.randomUUID();
    upload(token,sorted,header(List.of(1,1),List.of(event(1,"completed",0)))).andExpect(status().isOk());
    assertTrue(read(token,sorted,"/observations").path("observations").isEmpty());
    var pause=event(1,"pause",100); pause.put("reason","settings");
    var resume=event(2,"resume",100);
    var end=event(3,"timed_out",300000); end.put("reason","timeout");
    UUID timed=UUID.randomUUID();
    upload(token,timed,header(List.of(2,1),List.of(pause,resume,end))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("timed_out"));
    var wrong=event(2,"move",200); wrong.putAll(Map.of("itemId",1,"targetIndex",0,"inputMethod","touch","before",new BubbleTrace(List.of(2,1)).snapshot()));
    upload(token,UUID.randomUUID(),header(List.of(2,1),List.of(pause,wrong))).andExpect(status().isBadRequest());
  }
  @Test void requiresLearnerAndScopesAllReadsToTheOwner() throws Exception {
    String first=register("bubble.owner"),other=register("bubble.other"); UUID id=UUID.randomUUID();
    upload(first,id,header(List.of(2,1),List.of())).andExpect(status().isOk());
    mvc.perform(get("/api/game/me/learning-attempts/"+id).header("Authorization",other)).andExpect(status().isNotFound());
    mvc.perform(get("/api/game/me/learning-attempts/"+id+"/observations")).andExpect(status().isUnauthorized());
    var classroom=header(List.of(2,1),List.of()); classroom.put("source","classroom"); classroom.put("assignmentId",UUID.randomUUID());
    upload(first,UUID.randomUUID(),classroom).andExpect(status().isNotFound());
  }
}
