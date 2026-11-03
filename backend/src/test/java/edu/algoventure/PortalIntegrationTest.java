package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PortalIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserStore users;
  @Autowired PortalStore store;

  @Test
  @org.springframework.test.annotation.DirtiesContext(
      methodMode = org.springframework.test.annotation.DirtiesContext.MethodMode.BEFORE_METHOD)
  void swaggerDocumentsApiAndSupportsCookieCsrfLogin() throws Exception {
    mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    mvc.perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/admin/users'].get").exists())
        .andExpect(jsonPath("$.paths['/api/auth/logout'].post").exists())
        .andExpect(jsonPath("$.paths['/api/auth/csrf'].get.parameters").doesNotExist())
        .andExpect(jsonPath("$.components.securitySchemes.session.name").value("JSESSIONID"));
    mvc.perform(get("/swagger-ui/swagger-initializer.js"))
        .andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("X-XSRF-TOKEN")));
    var csrfResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    var result =
        mvc.perform(
                post("/api/auth/login")
                    .cookie(csrfResult.getResponse().getCookie("XSRF-TOKEN"))
                    .header("X-XSRF-TOKEN", body(csrfResult).path("token").asText())
                    .contentType("application/json")
                    .content(
                        "{\"email\":\"admin@algoventure.edu\",\"password\":\"Admin@Test123\"}"))
            .andExpect(status().isOk())
            .andReturn();
    var session = (MockHttpSession) result.getRequest().getSession(false);
    mvc.perform(get("/api/admin/users").session(session)).andExpect(status().isOk());
    var nextCsrf = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    mvc.perform(
            post("/api/auth/logout")
                .session(session)
                .cookie(nextCsrf.getResponse().getCookie("XSRF-TOKEN"))
                .header("X-XSRF-TOKEN", body(nextCsrf).path("token").asText()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
  }

  MockHttpSession login(String role) throws Exception {
    String password = role.equals("admin") ? "Admin@Test123" : "Instructor@Test123";
    var result =
        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType("application/json")
                    .content(
                        json.writeValueAsString(
                            Map.of("email", role + "@algoventure.edu", "password", password))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.password").doesNotExist())
            .andReturn();
    return (MockHttpSession) result.getRequest().getSession(false);
  }

  JsonNode body(org.springframework.test.web.servlet.MvcResult result) throws Exception {
    return json.readTree(result.getResponse().getContentAsString());
  }

  String classroom(MockHttpSession session, String name) throws Exception {
    return body(mvc.perform(
                post("/api/instructor/classes")
                    .session(session)
                    .with(csrf())
                    .contentType("application/json")
                    .content(
                        json.writeValueAsString(
                            Map.of(
                                "name",
                                name,
                                "description",
                                "",
                                "topicId",
                                "sorting",
                                "level",
                                "basic"))))
            .andExpect(status().isCreated())
            .andReturn())
        .path("id")
        .asText();
  }

  Map<String, Object> assignment(String cid, String status, List<String> lessons) {
    return Map.of(
        "classId",
        cid,
        "title",
        "Practice",
        "description",
        "",
        "status",
        status,
        "due",
        "2026-12-01",
        "lessonIds",
        lessons);
  }

  @Test
  void authenticationRolesCsrfAndLogout() throws Exception {
    mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/login").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content("{\"email\":\"admin@algoventure.edu\",\"password\":\"incorrect\"}"))
        .andExpect(status().isUnauthorized());
    var instructor = login("instructor");
    mvc.perform(get("/api/admin/users").session(instructor)).andExpect(status().isForbidden());
    var admin = login("admin");
    mvc.perform(get("/api/instructor/state").session(admin)).andExpect(status().isForbidden());
    mvc.perform(get("/api/auth/me").session(instructor))
        .andExpect(jsonPath("$.role").value("instructor"));
    mvc.perform(post("/api/auth/logout").session(instructor).with(csrf()))
        .andExpect(status().isNoContent());
    assertTrue(instructor.isInvalid());
  }

  @Test
  void classValidationPersistenceAndOwnership() throws Exception {
    var instructor = login("instructor");
    String cid = classroom(instructor, "Sorting Class");
    mvc.perform(get("/api/instructor/state").session(instructor))
        .andExpect(jsonPath("$.classes[0].id").value(cid))
        .andExpect(jsonPath("$.students").isEmpty());
    mvc.perform(
            post("/api/instructor/assignments")
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(assignment(cid, "Draft", List.of("binary")))))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/instructor/classes/unknown")
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\"New\",\"description\":\"\",\"topicId\":\"sorting\",\"level\":\"basic\"}"))
        .andExpect(status().isNotFound());
    String second = store.id();
    store
        .db()
        .update(
            "INSERT INTO app_users(id,email,name,password_hash,role,status) SELECT"
                + " ?,?,?,password_hash,role,status FROM app_users WHERE"
                + " email='instructor@algoventure.edu'",
            second,
            "other@example.com",
            "Other");
    String otherClass =
        store
            .saveClass(second, null, new PortalDtos.Classroom("Private", "", "sorting", "basic"))
            .get("id")
            .toString();
    mvc.perform(
            post("/api/instructor/assignments")
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(
                    json.writeValueAsString(assignment(otherClass, "Draft", List.of("bubble")))))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/instructor/classes/" + otherClass + "/materials").session(instructor))
        .andExpect(status().isNotFound());
  }

  @Test
  void duplicateClassNamesAreRejected() throws Exception {
    var instructor = login("instructor");
    classroom(instructor, "Sorting Class");
    mvc.perform(
            post("/api/instructor/classes")
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\" sorting class"
                        + " \",\"description\":\"\",\"topicId\":\"sorting\",\"level\":\"basic\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void publicationIsImmutableAndLocksTopic() throws Exception {
    var instructor = login("instructor");
    String cid = classroom(instructor, "Assignments");
    String aid =
        body(mvc.perform(
                    post("/api/instructor/assignments")
                        .session(instructor)
                        .with(csrf())
                        .contentType("application/json")
                        .content(
                            json.writeValueAsString(assignment(cid, "Active", List.of("bubble")))))
                .andExpect(status().isCreated())
                .andReturn())
            .path("id")
            .asText();
    mvc.perform(
            put("/api/instructor/assignments/" + aid)
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(assignment(cid, "Draft", List.of("selection")))))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/instructor/classes/" + cid)
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\"Assignments\",\"description\":\"\",\"topicId\":\"graphs\",\"level\":\"basic\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void materialUploadDownloadAndQuizReferences() throws Exception {
    var instructor = login("instructor");
    String cid = classroom(instructor, "Quizzes");
    var file = new MockMultipartFile("file", "notes.txt", "text/plain", "Lesson notes".getBytes());
    String mid =
        body(mvc.perform(
                    multipart("/api/instructor/classes/" + cid + "/materials")
                        .file(file)
                        .param("title", "Notes")
                        .param("description", "")
                        .session(instructor)
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andReturn())
            .path("id")
            .asText();
    mvc.perform(
            get("/api/instructor/classes/" + cid + "/materials/" + mid + "/download")
                .session(instructor))
        .andExpect(status().isOk())
        .andExpect(content().bytes("Lesson notes".getBytes()));
    var question =
        Map.of(
            "id",
            "q1",
            "prompt",
            "What is compared?",
            "options",
            List.of(Map.of("id", "a", "text", "Neighbors"), Map.of("id", "b", "text", "Ends")),
            "correctOptionId",
            "a",
            "explanation",
            "Adjacent items",
            "points",
            3);
    var quiz =
        Map.of(
            "classId",
            cid,
            "title",
            "Quiz",
            "description",
            "",
            "status",
            "Published",
            "questions",
            List.of(question),
            "materialIds",
            List.of(mid));
    String qid =
        body(mvc.perform(
                    post("/api/instructor/quizzes")
                        .session(instructor)
                        .with(csrf())
                        .contentType("application/json")
                        .content(json.writeValueAsString(quiz)))
                .andExpect(status().isCreated())
                .andReturn())
            .path("id")
            .asText();
    mvc.perform(
            delete("/api/instructor/classes/" + cid + "/materials/" + mid)
                .session(instructor)
                .with(csrf()))
        .andExpect(status().isBadRequest());
    mvc.perform(delete("/api/instructor/quizzes/" + qid).session(instructor).with(csrf()))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/instructor/quizzes/" + qid)
                .session(instructor)
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(quiz)))
        .andExpect(status().isBadRequest());
    mvc.perform(
            multipart("/api/instructor/classes/" + cid + "/materials")
                .file(new MockMultipartFile("file", "evil.html", "text/html", "bad".getBytes()))
                .param("title", "Bad")
                .session(instructor)
                .with(csrf()))
        .andExpect(status().isBadRequest());
  }

  @Test
  void invalidQuizzesAreRejectedByServer() throws Exception {
    var instructor = login("instructor");
    String cid = classroom(instructor, "Invalid quizzes");
    for (var questions :
        List.of(
            List.of(),
            List.of(
                Map.of(
                    "id",
                    "q",
                    "prompt",
                    "Question",
                    "options",
                    List.of(Map.of("id", "a", "text", "Same"), Map.of("id", "b", "text", "same")),
                    "correctOptionId",
                    "a",
                    "explanation",
                    "",
                    "points",
                    1)))) {
      mvc.perform(
              post("/api/instructor/quizzes")
                  .session(instructor)
                  .with(csrf())
                  .contentType("application/json")
                  .content(
                      json.writeValueAsString(
                          Map.of(
                              "classId",
                              cid,
                              "title",
                              "Invalid",
                              "description",
                              "",
                              "status",
                              "Published",
                              "questions",
                              questions,
                              "materialIds",
                              List.of()))))
          .andExpect(status().isBadRequest());
    }
  }

  @Test
  void adminCreatesAccountsEnrollsLearnersAndProtectsLastAdmin() throws Exception {
    var admin = login("admin");
    var instructor = login("instructor");
    String cid = classroom(instructor, "Enrollment");
    String uid =
        body(mvc.perform(
                    post("/api/admin/users")
                        .session(admin)
                        .with(csrf())
                        .contentType("application/json")
                        .content(
                            "{\"email\":\"learner@example.com\",\"name\":\"Learner\",\"role\":\"learner\",\"status\":\"Active\",\"password\":\"Learner@Test123\"}"))
                .andExpect(status().isCreated())
                .andReturn())
            .path("id")
            .asText();
    mvc.perform(
            post("/api/admin/classes/" + cid + "/members")
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(Map.of("userId", uid))))
        .andExpect(status().isCreated());
    mvc.perform(get("/api/instructor/state").session(instructor))
        .andExpect(jsonPath("$.students[0].email").value("learner@example.com"))
        .andExpect(jsonPath("$.students[0].score").doesNotExist());
    String adminId = users.byEmail("admin@algoventure.edu").id();
    mvc.perform(
            put("/api/admin/users/" + adminId)
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content("{\"name\":\"Admin\",\"role\":\"admin\",\"status\":\"Suspended\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/admin/export").session(admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.users[0].password_hash").doesNotExist());
  }

  @Test
  void suspendedAccountLosesExistingSession() throws Exception {
    var instructor = login("instructor");
    var admin = login("admin");
    String id = users.byEmail("instructor@algoventure.edu").id();
    mvc.perform(
            put("/api/admin/users/" + id)
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\"Instructor\",\"role\":\"instructor\",\"status\":\"Suspended\"}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/instructor/state").session(instructor))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void adminConfigurationPersistsAndValidatesThresholds() throws Exception {
    var admin = login("admin");
    mvc.perform(
            put("/api/admin/settings")
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content("{\"platformName\":\"My Portal\",\"maintenance\":true}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/admin/settings").session(admin))
        .andExpect(jsonPath("$.platformName").value("My Portal"));
    mvc.perform(
            put("/api/admin/algorithms/bubble")
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\"Bubble\",\"difficulty\":\"Easy\",\"status\":\"Published\",\"config\":{\"timeLimit\":300,\"starThresholds\":[300,200,100],\"hintsAllowed\":true,\"prerequisites\":[]}}"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/admin/algorithms/bubble")
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"name\":\"Bubble\",\"difficulty\":\"Easy\",\"status\":\"Published\",\"config\":{\"timeLimit\":300,\"starThresholds\":[100,200,300],\"hintsAllowed\":true,\"prerequisites\":[\"selection\"]}}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Cấu hình tạo vòng lặp bài tiên quyết."));
    mvc.perform(
            put("/api/admin/features/practice")
                .session(admin)
                .with(csrf())
                .contentType("application/json")
                .content("{\"enabled\":true}"))
        .andExpect(status().isOk());
    assertEquals(
        true,
        store
            .db()
            .queryForObject(
                "SELECT enabled FROM feature_toggles WHERE id='practice'", Boolean.class));
  }
}
