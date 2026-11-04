package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@Transactional
public class GameController {
  private static final Random challengeRandom = new java.security.SecureRandom();
  final PortalStore s; final UserStore users; final LearnerSessions sessions;
  public GameController(PortalStore s, UserStore users, LearnerSessions sessions) { this.s=s; this.users=users; this.sessions=sessions; }
  String user(Authentication auth) {
    var account=users.byEmail(auth.getName()); sessions.profile(account); return account.id();
  }

  @GetMapping("/me/state") Object state(Authentication auth) {
    var result=state(user(auth));
    result.put("lessonRules", s.db().query("SELECT id,status,config FROM algorithms WHERE status<>'Retired'", (r,n) -> {
      var config=(Map<?,?>)s.decode(r.getString("config"));
      return s.map("id",r.getString("id"),"published","Published".equals(r.getString("status")),"prerequisites",config.get("prerequisites"));
    }));
    result.put("leaderboardEnabled", leaderboardEnabled());
    return result;
  }
  Map<String,Object> state(String uid) {
    var profile=s.db().queryForObject("SELECT p.*,u.joined FROM learner_profiles p JOIN app_users u ON u.id=p.user_id WHERE p.user_id=?",(r,n)->s.map("name",r.getString("display_name"),"avatar",r.getString("avatar"),"avatarImage",r.getString("avatar_image"),"joinedAt",PortalStore.timestamp(r,"joined")),uid);
    var history=s.db().query("SELECT lesson_id,completed_at FROM practice_events WHERE user_id=? ORDER BY completed_at DESC,id DESC LIMIT 50",(r,n)->s.map("lesson",r.getString(1),"at",PortalStore.timestamp(r,"completed_at")),uid);
    var dates=s.db().query("SELECT completed_at FROM practice_events WHERE user_id=? ORDER BY completed_at",(r,n)->r.getObject(1,OffsetDateTime.class).atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate().toString(),uid).stream().distinct().toList();
    profile.put("history",history); profile.put("practiceDays",dates);
    Map<String,List<Integer>> linked=new LinkedHashMap<>(); Map<String,Boolean> completed=new LinkedHashMap<>();
    var rows=s.db().queryForList("SELECT lesson_id,stage FROM lesson_completions WHERE user_id=? ORDER BY lesson_id,stage",uid);
    for(var row:rows) {
      String lesson=(String)row.get("lesson_id"); int stage=((Number)row.get("stage")).intValue();
      // The old Traversal course covered both DFS and BFS. Retain its original
      // completion row/score while exposing the current progress IDs.
      if(lesson.equals("tree-traversal")) {
        completed.put("tree-dfs",true); completed.put("tree-bfs",true); continue;
      }
      if(!s.catalog().isCurrent(lesson)) continue;
      if(lesson.startsWith("linked-")) linked.computeIfAbsent(lesson,k->new ArrayList<>()).add(stage);
      else completed.put(lesson,true);
    }
    linked.forEach((lesson,stages) -> {
      if(stages.containsAll(List.of(1,2,3))) completed.put(lesson,true);
    });
    return s.map("profile",profile,"completed",completed,"linkedLevels",linked);
  }
  record Profile(@NotBlank @Size(max=24) String name, @NotNull @Pattern(regexp="fox|buta") String avatar,
      @Size(max=500000) @Pattern(regexp="data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+") String avatarImage) {}
  @PutMapping("/me/profile") Object profile(Authentication auth,@Valid @RequestBody Profile v) {
    String uid=user(auth);
    s.db().update("UPDATE learner_profiles SET display_name=?,avatar=?,avatar_image=? WHERE user_id=?",v.name().trim(),v.avatar(),v.avatarImage(),uid);
    return state(uid);
  }
  record Completion(@NotNull UUID clientAttemptId,@NotBlank String lessonId,@Min(1) @Max(3) int stage, String assignmentId) {}
  @PostMapping("/me/bubble-challenges")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  Object issueBubbleChallenge(Authentication auth, @RequestParam(required=false) String assignmentId) {
    String uid=user(auth);
    if(s.db().queryForObject("SELECT COUNT(*) FROM algorithms WHERE id='bubble' AND status='Published'",Integer.class)==0)
      throw ApiException.missing();
    var pool=new ArrayList<>(java.util.stream.IntStream.rangeClosed(1,19).boxed().toList());
    Collections.shuffle(pool,challengeRandom);
    List<Integer> input=new ArrayList<>(pool.subList(0,8));
    String difficulty="hard";
    Map<?,?> custom=null;
    if(assignmentId!=null) {
      var assignment=s.learnerAssignment(uid,assignmentId,"bubble");
      custom=(Map<?,?>)((Map<?,?>)assignment.get("lessonConfigs")).get("bubble");
      if(custom!=null) {
        if(custom.get("input") instanceof List<?> values) input=values.stream().map(n->((Number)n).intValue()).toList();
        if(custom.get("difficulty") instanceof String value) difficulty=value;
        else difficulty="easy";
        if(custom.get("input")==null) input=new ArrayList<>(pool.subList(0,difficulty.equals("easy")?5:difficulty.equals("medium")?7:8));
      }
    }
    int inversions=0;
    for(int i=0;i<input.size();i++)
      for(int j=i+1;j<input.size();j++)
        if(input.get(i)>input.get(j)) inversions++;
    if(custom==null && inversions<8) Collections.reverse(input);
    String id=s.id();
    s.db().update("INSERT INTO bubble_challenges(id,user_id,input_json,assignment_id,difficulty) VALUES (?,?,?,?,?)",id,uid,s.encode(input),assignmentId,difficulty);
    return s.map("clientAttemptId",id,"input",input);
  }
  @PostMapping("/me/completions") Object complete(Authentication auth,@Valid @RequestBody Completion v) {
    String uid=user(auth);
    if(!s.catalog().isCurrent(v.lessonId())) throw ApiException.missing();
    if(v.assignmentId()!=null) {
      var assignment=s.learnerAssignment(uid,v.assignmentId(),v.lessonId());
      if(((Map<?,?>)assignment.get("lessonConfigs")).containsKey(v.lessonId())) {
        var rules=s.db().queryForList("SELECT config FROM algorithms WHERE id=? AND status='Published'",v.lessonId());
        if(rules.isEmpty()) throw ApiException.missing();
        var required=new HashSet<>(prerequisites(v.lessonId()));
        var config=(Map<?,?>)s.decode((String)rules.getFirst().get("config"));
        if(config.get("prerequisites") instanceof List<?> extra) for(var lesson:extra) required.add((String)lesson);
        if(!((Map<?,?>)state(uid).get("completed")).keySet().containsAll(required)) throw ApiException.bad("Hãy hoàn thành bài tiên quyết trước.");
        if(v.stage()!=1) throw ApiException.bad("Chặng của bài giao không hợp lệ.");
        if(v.lessonId().equals("bubble")) verifyAssignedBubble(uid,v.clientAttemptId(),v.assignmentId());
        if(s.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=? AND lesson_id=?",Integer.class,v.assignmentId(),uid,v.lessonId())==0)
          s.db().update("INSERT INTO assignment_completions(assignment_id,user_id,lesson_id) VALUES (?,?,?)",v.assignmentId(),uid,v.lessonId());
        return state(uid);
      }
    }
    var old=s.db().queryForList("SELECT lesson_id,stage FROM practice_events WHERE user_id=? AND client_id=?",uid,v.clientAttemptId().toString());
    if(!old.isEmpty()) {
      if(!old.getFirst().get("lesson_id").equals(v.lessonId()) || ((Number)old.getFirst().get("stage")).intValue()!=v.stage()) throw ApiException.bad("Mã lượt chơi đã được dùng cho bài khác.");
      return state(uid);
    }
    if(Catalog.currentLessons(v.lessonId()).size()>1)
      throw ApiException.bad("Hãy hoàn thành đủ ba thao tác của bài học này.");
    var lessons=s.db().queryForList("SELECT config FROM algorithms WHERE id=? AND status='Published'",v.lessonId());
    if(lessons.isEmpty()) throw ApiException.missing();
    if(!v.lessonId().startsWith("linked-") && v.stage()!=1) throw ApiException.bad("Chặng học không hợp lệ.");
    if(v.lessonId().equals("bubble")) verifyBubbleCompletion(uid, v.clientAttemptId());
    @SuppressWarnings("unchecked") var configured=(Map<String,Object>)s.decode((String)lessons.getFirst().get("config"));
    Set<String> prerequisites=new LinkedHashSet<>(prerequisites(v.lessonId()));
    @SuppressWarnings("unchecked") var extra=(List<String>)configured.get("prerequisites"); prerequisites.addAll(extra);
    @SuppressWarnings("unchecked") var completed=(Map<String,Boolean>)state(uid).get("completed");
    if(!completed.keySet().containsAll(prerequisites)) throw ApiException.bad("Hãy hoàn thành bài tiên quyết trước.");
    if(v.lessonId().startsWith("linked-") && v.stage()>1 && s.db().queryForObject("SELECT COUNT(*) FROM lesson_completions WHERE user_id=? AND lesson_id=? AND stage=?",Integer.class,uid,v.lessonId(),v.stage()-1)==0)
      throw ApiException.bad("Hãy hoàn thành chặng trước của bài học.");
    s.db().update("INSERT INTO practice_events(id,user_id,client_id,lesson_id,stage) VALUES (?,?,?,?,?)",s.id(),uid,v.clientAttemptId().toString(),v.lessonId(),v.stage());
    if(!completed.containsKey(v.lessonId()) && s.db().queryForObject("SELECT COUNT(*) FROM lesson_completions WHERE user_id=? AND lesson_id=? AND stage=?",Integer.class,uid,v.lessonId(),v.stage())==0)
      s.db().update("INSERT INTO lesson_completions(id,user_id,lesson_id,stage) VALUES (?,?,?,?)",s.id(),uid,v.lessonId(),v.stage());
    @SuppressWarnings("unchecked") var updated=(Map<String,Boolean>)state(uid).get("completed");
    if(updated.containsKey(v.lessonId())) for(var assignment:s.db().query("SELECT a.* FROM assignments a JOIN enrollments e ON e.class_id=a.class_id WHERE e.user_id=? AND a.status='Active'",(r,n)->s.assignment(r),uid)) {
      @SuppressWarnings("unchecked") var ids=(List<String>)assignment.get("lessonIds");
      String due=Objects.toString(assignment.get("due"),"");
      if(!due.isEmpty() && LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).isAfter(LocalDate.parse(due))) continue;
      for(String assignedLesson:ids) {
        var required=Catalog.currentLessons(assignedLesson);
        var custom=(Map<?,?>)assignment.get("lessonConfigs");
        if(custom.containsKey(assignedLesson) || required.stream().anyMatch(custom::containsKey)) continue;
        boolean finished=assignedLesson.equals(v.lessonId())
            || required.contains(v.lessonId()) && updated.keySet().containsAll(required);
        if(finished && s.db().queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=? AND lesson_id=?",Integer.class,assignment.get("id"),uid,assignedLesson)==0)
          s.db().update("INSERT INTO assignment_completions(assignment_id,user_id,lesson_id) VALUES (?,?,?)",assignment.get("id"),uid,assignedLesson);
      }
    }
    return state(uid);
  }
  static List<String> prerequisites(String lesson) {
    for(var route:List.of(List.of("bubble","selection","insertion","merge","quick"),List.of("linear","binary"),List.of("linked-list","linked-traversal","linked-search","linked-insertion","linked-deletion","linked-reversal"),List.of("tree-basics","tree-dfs","tree-bfs","bst-search","bst-insert","bst-delete"),List.of("graph-basics","bfs","dfs","dijkstra"))) {
      int index=route.indexOf(lesson); if(index>=0) return route.subList(0,index);
    }
    return List.of();
  }
  private void verifyAssignedBubble(String uid, UUID attempt, String assignment) {
    var rows=s.db().queryForList("SELECT c.assignment_id FROM bubble_challenges c JOIN learning_attempts a ON a.client_attempt_id=c.id AND a.user_id=c.user_id WHERE c.id=? AND c.user_id=? AND a.status='completed'",attempt.toString(),uid);
    if(rows.isEmpty() || !assignment.equals(rows.getFirst().get("assignment_id")))
      throw ApiException.bad("Chưa có nhật ký hoàn thành hợp lệ cho bài giao này.");
  }
  private void verifyBubbleCompletion(String uid, UUID attemptId) {
    var records=s.db().queryForList(
        "SELECT a.metadata,c.input_json,c.assignment_id FROM learning_attempts a JOIN bubble_challenges c ON c.id=a.client_attempt_id AND c.user_id=a.user_id WHERE a.user_id=? AND a.client_attempt_id=? AND a.lesson_id='bubble' AND a.status='completed'",
        uid,attemptId.toString());
    if(records.isEmpty()) throw ApiException.bad("Chưa có nhật ký hoàn thành Bubble Sort hợp lệ.");
    var row=records.getFirst();
    if(row.get("assignment_id")!=null) {
      var configs=(Map<?,?>)s.decode(s.db().queryForObject("SELECT lesson_configs FROM assignments WHERE id=?",String.class,row.get("assignment_id")));
      if(configs.containsKey("bubble")) throw ApiException.bad("Lượt chơi tùy chỉnh chỉ ghi kết quả cho bài giao tương ứng.");
    }
    var metadata=(Map<?,?>)s.decode((String)row.get("metadata"));
    if(!"hard".equals(metadata.get("difficulty")) || metadata.get("activity")!=null
        || !(metadata.get("input") instanceof List<?> input) || input.size()!=8
        || new HashSet<>(input).size()!=8
        || input.stream().anyMatch(value -> !(value instanceof Integer n) || n<1 || n>19))
      throw ApiException.bad("Hãy hoàn thành thử thách Bubble Sort ở mức Khó.");
    if(!input.equals(s.decode((String)row.get("input_json"))))
      throw ApiException.bad("Mảng Bubble Sort không khớp đề máy chủ đã cấp.");
    Integer moves=s.db().queryForObject(
        "SELECT COUNT(*) FROM learning_interactions WHERE user_id=? AND client_attempt_id=? AND kind='move'",
        Integer.class,uid,attemptId.toString());
    if(moves==0) throw ApiException.bad("Lượt Bubble Sort phải có thao tác đổi chỗ.");
  }
  @GetMapping("/curriculum") Object curriculum() {
    return s.map("topics",s.catalog().topics,"lessons",s.db().query("SELECT id,name,status,config FROM algorithms WHERE status<>'Retired' ORDER BY id",(r,n)->s.map("id",r.getString(1),"name",r.getString(2),"status",r.getString(3),"config",s.decode(r.getString(4)))),"features",s.db().query("SELECT id,enabled FROM feature_toggles",(r,n)->s.map("id",r.getString(1),"enabled",r.getBoolean(2))));
  }
  @GetMapping("/leaderboard") Object leaderboard(Authentication auth,@RequestParam(defaultValue="weekly") String period) {
    if(!leaderboardEnabled()) throw ApiException.missing();
    if(!Set.of("weekly","all-time").contains(period)) throw ApiException.bad("Thời gian xếp hạng không hợp lệ.");
    String uid=user(auth);
    Instant since=period.equals("weekly") ? LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant() : Instant.EPOCH;
    var rows=s.db().query("SELECT p.*,u.id AS account_id FROM learner_profiles p JOIN app_users u ON u.id=p.user_id WHERE u.role='learner' AND u.status='Active'",(r,n)->s.map("id",r.getString("account_id"),"name",r.getString("display_name"),"avatar",r.getString("avatar"),"avatarImage",r.getString("avatar_image"),"color","#a6e6d1","climb",0,"isPlayer",uid.equals(r.getString("account_id"))));
    for(var row:rows) {
      var first=s.db().query("SELECT lesson_id,CASE WHEN lesson_id LIKE 'linked-%' THEN MAX(completed_at) ELSE MIN(completed_at) END AS first_at FROM lesson_completions WHERE user_id=? GROUP BY lesson_id HAVING lesson_id NOT LIKE 'linked-%' OR COUNT(DISTINCT stage)=3",(r,n)->r.getObject("first_at",OffsetDateTime.class).toInstant(),row.get("id"));
      row.put("score",first.stream().filter(t->!t.isBefore(since)).count()*100);
    }
    rows.sort(Comparator.<Map<String,Object>>comparingLong(r->((Number)r.get("score")).longValue()).reversed().thenComparing(r->(String)r.get("id")));
    for(int i=0;i<rows.size();i++) rows.get(i).put("rank",i+1);
    var player=rows.stream().filter(r->Boolean.TRUE.equals(r.get("isPlayer"))).findFirst().orElseThrow();
    return s.map("entries",rows.stream().limit(100).toList(),"player",player,"period",period);
  }
  private boolean leaderboardEnabled() {
    return s.db().queryForList("SELECT enabled FROM feature_toggles WHERE id='leaderboard'", Boolean.class)
      .stream().findFirst().orElse(true);
  }
}
