package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class LearnerIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired PortalStore store;
  long nextGameId = 100;

  JsonNode postJson(String path, MockHttpSession session, Object body) throws Exception {
    var request=post(path).with(csrf()).contentType("application/json").content(json.writeValueAsString(body));
    if(session!=null)request.session(session);
    return json.readTree(mvc.perform(request).andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString());
  }
  MockHttpSession login(String email,String password) throws Exception {
    return (MockHttpSession)mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password",password))))
      .andExpect(status().isOk()).andReturn().getRequest().getSession(false);
  }
  String learner(String email) throws Exception {
    var admin=login("admin@algoventure.edu","Admin@Test123");
    postJson("/api/admin/users",admin,Map.of("email",email,"name","Student","password","Learner@Test123","role","learner","status","Active"));
    var login = json.readTree(mvc.perform(post("/api/game/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password","Learner@Test123")))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    return "Bearer " + login.path("token").asText();
  }
  JsonNode postJson(String path,String bearer,Object body) throws Exception {
    return json.readTree(mvc.perform(post(path).header("Authorization",bearer).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString());
  }
  JsonNode getJson(String path,String bearer) throws Exception {
    return json.readTree(mvc.perform(get(path).header("Authorization",bearer)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
  }
  JsonNode getJson(String path, MockHttpSession session) throws Exception {
    return json.readTree(mvc.perform(get(path).session(session)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
  }
  @Test void classroomMembershipAndQuizStayIsolatedFromGameProgress() throws Exception {
    var teacher=login("instructor@algoventure.edu","Instructor@Test123");
    var classroom=postJson("/api/instructor/classes",teacher,Map.of("name","Connected Classroom","description","","topicId","sorting","level","basic"));
    String cid=classroom.path("id").asText();
    assertEquals(8,classroom.path("inviteCode").asText().length());
    var student=learner("classroom-student@example.test");
    var outsider=learner("classroom-outsider@example.test");
    mvc.perform(get("/api/learner/classes")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/learner/classes").session(teacher)).andExpect(status().isUnauthorized());
    postJson("/api/learner/classes/join",student,Map.of("code",classroom.path("inviteCode").asText()));
    assertEquals(cid,getJson("/api/learner/classes",student).get(0).path("id").asText());
    assertTrue(getJson("/api/learner/classes",outsider).isEmpty());
    assertEquals(2,store.db().queryForObject("SELECT COUNT(*) FROM learner_profiles",Integer.class));
    mvc.perform(get("/api/learner/classes").header("Authorization","Bearer expired")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/learner/classes/"+cid+"/assignments").header("Authorization",outsider)).andExpect(status().isNotFound());
    var q=Map.of("id","q1","prompt","Pick A","options",List.of(Map.of("id","a","text","A"),Map.of("id","b","text","B")),"correctOptionId","a","explanation","A is correct","points",3);
    var quiz=postJson("/api/instructor/quizzes",teacher,Map.of("classId",cid,"title","Classroom Quiz","description","","status","Published","due","2099-12-01","questions",List.of(q),"materialIds",List.of()));
    String qid=quiz.path("id").asText();
    mvc.perform(get("/api/learner/assignments/"+qid).header("Authorization",student)).andExpect(jsonPath("$.questions[0].correctIndex").doesNotExist());
    var submission=Map.of("clientAttemptId",UUID.randomUUID(),"answers",List.of(Map.of("questionId","q1","selectedIndex",0)));
    var result=postJson("/api/learner/assignments/"+qid+"/attempts",student,submission);
    assertEquals(100,result.path("scorePercent").asInt());
    assertEquals(result,postJson("/api/learner/assignments/"+qid+"/attempts",student,submission));
    assertEquals(1,getJson("/api/learner/assignments/"+qid+"/attempts",student).size());
    mvc.perform(delete("/api/learner/classes/"+cid).header("Authorization",student).with(csrf())).andExpect(status().isNoContent());
    assertTrue(getJson("/api/learner/classes",student).isEmpty());
    mvc.perform(get("/api/learner/assignments/"+qid).header("Authorization",student)).andExpect(status().isNotFound());
    postJson("/api/learner/classes/join",student,Map.of("code",classroom.path("inviteCode").asText()));
    assertEquals(1,getJson("/api/learner/assignments/"+qid+"/attempts",student).size());
    assertEquals(0,store.db().queryForObject("SELECT COUNT(*) FROM lesson_completions",Integer.class));
    assertEquals(0,store.db().queryForObject("SELECT COUNT(*) FROM assignment_completions",Integer.class));
  }
}
