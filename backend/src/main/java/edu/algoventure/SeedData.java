package edu.algoventure;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
class SeedData implements ApplicationRunner {
  final PortalStore store;
  final PasswordEncoder passwords;

  @Value("${app.seed.enabled}")
  boolean enabled;

  @Value("${app.seed.admin-password}")
  String adminPassword;

  @Value("${app.seed.instructor-password}")
  String instructorPassword;

  SeedData(PortalStore store, PasswordEncoder passwords) {
    this.store = store;
    this.passwords = passwords;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    // Catalog entries are product data, not fabricated learner results.
    for (var topic : store.catalog().topics)
      for (var lesson : topic.path("lessons")) {
        if (store
                .db()
                .queryForObject(
                    "SELECT COUNT(*) FROM algorithms WHERE id=?",
                    Integer.class,
                    lesson.get(0).asText())
            == 0)
          store
              .db()
              .update(
                  "INSERT INTO algorithms(id,topic_id,name,difficulty,status,config) VALUES"
                      + " (?,?,?,?,?,?)",
                  lesson.get(0).asText(),
                  topic.path("id").asText(),
                  lesson.get(1).asText(),
                  "Easy",
                  "Published",
                  store.encode(
                      Map.of(
                          "timeLimit",
                          300,
                          "starThresholds",
                          List.of(100, 200, 300),
                          "hintsAllowed",
                          true,
                          "prerequisites",
                          List.of())));
      }
    String[][] features = {
      {"adaptive", "Learning", "Adaptive Difficulty", "Điều chỉnh theo kết quả học tập"},
      {"sandbox", "Learning", "Visualizer Sandbox", "Thực hành với dữ liệu tùy chỉnh"},
      {"xp", "Learning", "Gamified XP Rewards", "Phần thưởng học tập"},
      {"practice", "Learning", "Practice Mode", "Luyện tập lại bài học"},
      {"leaderboard", "Social", "Leaderboard", "Bảng xếp hạng"},
      {"badges", "Social", "Achievements & Badges", "Thành tích học tập"},
      {"offline", "System", "Offline Mode", "Đồng bộ khi có kết nối"},
      {"bilingual", "System", "Bilingual Support", "Tiếng Việt và tiếng Anh"}
    };
    for (String[] f : features)
      if (store
              .db()
              .queryForObject(
                  "SELECT COUNT(*) FROM feature_toggles WHERE id=?", Integer.class, f[0])
          == 0)
        store
            .db()
            .update(
                "INSERT INTO feature_toggles(id,category,title,description,enabled) VALUES"
                    + " (?,?,?,?,?)",
                f[0],
                f[1],
                f[2],
                f[3],
                false);
    if (!enabled) return;
    if (adminPassword.length() < 10 || instructorPassword.length() < 10)
      throw new IllegalStateException(
          "Seed passwords must be provided and contain at least 10 characters");
    addUser("admin@algoventure.edu", "Alex Rivera", "admin", adminPassword);
    addUser("instructor@algoventure.edu", "Elena Rostova", "instructor", instructorPassword);
  }

  void addUser(String email, String name, String role, String password) {
    if (store
            .db()
            .queryForObject("SELECT COUNT(*) FROM app_users WHERE email=?", Integer.class, email)
        == 0)
      store
          .db()
          .update(
              "INSERT INTO app_users(id,email,name,role,status,password_hash) VALUES (?,?,?,?,?,?)",
              store.id(),
              email,
              name,
              role,
              "Active",
              passwords.encode(password));
  }
}
