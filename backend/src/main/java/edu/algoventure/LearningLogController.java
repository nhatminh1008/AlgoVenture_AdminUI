package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/me/learning-attempts")
@Transactional
public class LearningLogController {
  static final String KC="bubble.next_swap.v1";
  final PortalStore s;
  final UserStore users;
  final PracticeCatalog catalog;
  public LearningLogController(PortalStore s,UserStore users,PracticeCatalog catalog) { this.s=s; this.users=users; this.catalog=catalog; }
  record Event(@NotNull UUID eventId,@Min(1) int sequence,
      @NotNull @Pattern(regexp="move|pause|resume|completed|abandoned|timed_out") String kind,
      @NotNull Instant occurredAt,@Min(0) @Max(300000) int elapsedMs,
      Integer itemId,Integer targetIndex,
      @Pattern(regexp="mouse|touch|pen|keyboard") String inputMethod,
      @Pattern(regexp="settings|hidden|leave|restart|harder|timeout") String reason,
      BubbleTrace.Snapshot before) {}
  record Upload(@Min(1) @Max(1) int schemaVersion,
      @NotNull @Pattern(regexp="bubble-v1") String engineVersion,
      @NotNull @Pattern(regexp="bubble") String lessonId,
      @NotNull @Pattern(regexp="play") String mode,
      @NotNull @Pattern(regexp="map|classroom") String source,UUID assignmentId,
      @NotNull @Pattern(regexp="easy|medium|hard") String difficulty,
      @NotNull @Size(min=2,max=8) List<@NotNull @Min(-99) @Max(99) Integer> input,
      @NotNull Instant startedAt,@NotNull @Size(max=2000) List<@NotNull @Valid Event> events,
      @Pattern(regexp="supplementary") String activity,
      @Size(max=80) String exerciseId,UUID recommendationId) {}
  record Header(int schemaVersion,String engineVersion,String lessonId,String mode,String source,
      UUID assignmentId,String difficulty,List<Integer> input,Instant startedAt,
      @JsonInclude(JsonInclude.Include.NON_NULL) String activity,
      @JsonInclude(JsonInclude.Include.NON_NULL) String exerciseId,
      @JsonInclude(JsonInclude.Include.NON_NULL) UUID recommendationId) {
    Header(Upload v) { this(v.schemaVersion(),v.engineVersion(),v.lessonId(),v.mode(),v.source(),v.assignmentId(),v.difficulty(),v.input(),v.startedAt(),v.activity(),v.exerciseId(),v.recommendationId()); }
  }
  String owner(Authentication auth) { return users.byEmail(auth.getName()).id(); }
  static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT,message); }

  @PutMapping("/{id}")
  Object upload(Authentication auth,@PathVariable UUID id,@Valid @RequestBody Upload v) {
    String uid=owner(auth), aid=id.toString();
    // Serialize creation/append for this account, including simultaneous retry requests.
    s.db().queryForList("SELECT id FROM app_users WHERE id=? FOR UPDATE",uid);
    var issued=s.db().queryForList("SELECT user_id,input_json FROM bubble_challenges WHERE id=?",aid);
    if(!issued.isEmpty()) {
      var challenge=issued.getFirst();
      if(!uid.equals(challenge.get("user_id"))) throw ApiException.missing();
      if(!"hard".equals(v.difficulty()) || v.activity()!=null
          || !v.input().equals(s.decode((String)challenge.get("input_json"))))
        throw ApiException.bad("Nhật ký Bubble Sort không khớp đề máy chủ đã cấp.");
    }
    if(v.source().equals("classroom")!=(v.assignmentId()!=null)) throw ApiException.bad("Nguồn bài chơi không khớp bài giao.");
    if((v.activity()!=null)!=(v.exerciseId()!=null) || (v.recommendationId()!=null && v.exerciseId()==null)) throw ApiException.bad("Thông tin bài luyện bổ trợ chưa đầy đủ.");
    String metadata=s.encode(new Header(v));
    var attempts=s.db().queryForList("SELECT metadata,status,event_count FROM learning_attempts WHERE user_id=? AND client_attempt_id=?",uid,aid);
    if(!attempts.isEmpty()&&!attempts.getFirst().get("metadata").equals(metadata)) throw conflict("Mã lượt chơi đã dùng với cấu hình khác.");
    if(attempts.isEmpty() && v.exerciseId()!=null) {
      var exercise=catalog.get(v.exerciseId());
      if(!exercise.input().equals(v.input()) || !exercise.difficulty().equals(v.difficulty())) throw ApiException.bad("Cấu hình không khớp bài luyện.");
      if(v.recommendationId()!=null) {
        var records=s.db().queryForList("SELECT response_json,context_json FROM adaptive_recommendations WHERE id=? AND user_id=?",v.recommendationId().toString(),uid);
        if(records.isEmpty()) throw ApiException.missing();
        var response=(Map<?,?>)s.decode((String)records.getFirst().get("response_json"));
        var context=(Map<?,?>)s.decode((String)records.getFirst().get("context_json"));
        if(!"ready".equals(response.get("status")) || !v.exerciseId().equals(response.get("exerciseId"))
            || !Objects.equals(Objects.toString(v.assignmentId(),null),context.get("assignmentId"))) throw ApiException.bad("Bài luyện không khớp đề xuất.");
      }
    }
    if(attempts.isEmpty()&&v.assignmentId()!=null) {
      var assignment=s.db().queryForList("SELECT a.lesson_ids FROM assignments a JOIN enrollments e ON e.class_id=a.class_id WHERE a.id=? AND e.user_id=? AND a.status='Active'",v.assignmentId().toString(),uid);
      if(assignment.isEmpty()||!((List<?>)s.decode((String)assignment.getFirst().get("lesson_ids"))).contains("bubble")) throw ApiException.missing();
    }
    var old=s.db().query("SELECT raw_event FROM learning_interactions WHERE user_id=? AND client_attempt_id=? ORDER BY sequence_no",(r,n)->r.getString(1),uid,aid);
    for(int i=0;i<Math.min(old.size(),v.events().size());i++) if(!old.get(i).equals(s.encode(v.events().get(i)))) throw conflict("Không được thay đổi sự kiện đã ghi nhận.");
    var trace=new BubbleTrace(v.input());
    var evaluations=new ArrayList<Map<String,Object>>();
    Set<UUID> seen=new HashSet<>();
    String status="in_progress";
    int lastElapsed=0,opportunity=1;
    boolean first=true,paused=false;
    for(int i=0;i<v.events().size();i++) {
      var e=v.events().get(i);
      if(e.sequence()!=i+1||!seen.add(e.eventId())||e.elapsedMs()<lastElapsed||!status.equals("in_progress")) throw ApiException.bad("Chuỗi sự kiện không liên tục, bị trùng hoặc đã kết thúc.");
      lastElapsed=e.elapsedMs();
      var before=trace.snapshot();
      Map<String,Object> evaluation=s.map("sequence",e.sequence(),"eventId",e.eventId(),"kind",e.kind());
      if(e.kind().equals("move")) {
        if(paused||e.itemId()==null||e.targetIndex()==null||e.inputMethod()==null||e.reason()!=null||!before.equals(e.before())) throw ApiException.bad("Trạng thái trước thao tác không khớp engine Bubble Sort.");
        int comparisons=trace.comparisons;
        boolean correct=trace.move(e.itemId(),e.targetIndex());
        evaluation.putAll(s.map("kcId",KC,"correct",correct,"opportunity",opportunity,"firstResponse",first,
            "before",before,"after",trace.snapshot(),"automaticComparisons",trace.comparisons-comparisons-(correct?1:0)));
        first=false;
        if(correct) { opportunity++; first=true; }
      } else {
        if(e.itemId()!=null||e.targetIndex()!=null||e.inputMethod()!=null||e.before()!=null) throw ApiException.bad("Sự kiện vòng đời không được mang thao tác đổi chỗ.");
        switch(e.kind()) {
          case "pause" -> { if(paused||!Set.of("settings","hidden").contains(Objects.toString(e.reason(),""))) throw ApiException.bad("Tạm dừng không hợp lệ."); paused=true; }
          case "resume" -> { if(!paused||e.reason()!=null) throw ApiException.bad("Tiếp tục không hợp lệ."); paused=false; }
          case "completed" -> { if(!trace.done||e.reason()!=null) throw ApiException.bad("Chưa hoàn thành Bubble Sort."); status="completed"; }
          case "timed_out" -> { if(trace.done||e.elapsedMs()!=300000||!"timeout".equals(e.reason())) throw ApiException.bad("Hết giờ không hợp lệ."); status="timed_out"; }
          case "abandoned" -> { if(!Set.of("leave","restart","harder").contains(Objects.toString(e.reason(),""))) throw ApiException.bad("Lý do kết thúc không hợp lệ."); status="abandoned"; }
          default -> throw ApiException.bad("Sự kiện không hỗ trợ.");
        }
      }
      evaluations.add(evaluation);
    }
    if(attempts.isEmpty()) s.db().update("INSERT INTO learning_attempts(user_id,client_attempt_id,lesson_id,metadata,started_at,status) VALUES (?,?,?,?,?,'in_progress')",uid,aid,"bubble",metadata,Timestamp.from(v.startedAt()));
    for(int i=old.size();i<v.events().size();i++) {
      var e=v.events().get(i);
      s.db().update("INSERT INTO learning_interactions(user_id,client_attempt_id,sequence_no,event_id,kind,occurred_at,raw_event,evaluation) VALUES (?,?,?,?,?,?,?,?)",uid,aid,e.sequence(),e.eventId().toString(),e.kind(),Timestamp.from(e.occurredAt()),s.encode(e),s.encode(evaluations.get(i)));
    }
    if(v.events().size()>=old.size()) s.db().update("UPDATE learning_attempts SET status=?,event_count=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND client_attempt_id=?",status,v.events().size(),uid,aid);
    var saved=s.db().queryForMap("SELECT status,event_count FROM learning_attempts WHERE user_id=? AND client_attempt_id=?",uid,aid);
    return s.map("clientAttemptId",id,"acknowledgedSequence",saved.get("event_count"),"status",saved.get("status"));
  }

  Map<String,Object> read(String uid,UUID id) {
    var rows=s.db().query("SELECT * FROM learning_attempts WHERE user_id=? AND client_attempt_id=?",(r,n)->s.map("metadata",r.getString("metadata"),"status",r.getString("status"),"event_count",r.getInt("event_count"),"receivedAt",PortalStore.timestamp(r,"received_at"),"updatedAt",PortalStore.timestamp(r,"updated_at")),uid,id.toString());
    if(rows.isEmpty()) throw ApiException.missing();
    var row=rows.getFirst();
    return s.map("clientAttemptId",id,"metadata",s.decode((String)row.get("metadata")),"status",row.get("status"),"eventCount",row.get("event_count"),"receivedAt",row.get("receivedAt"),"updatedAt",row.get("updatedAt"),
        "events",s.db().query("SELECT raw_event,evaluation,received_at FROM learning_interactions WHERE user_id=? AND client_attempt_id=? ORDER BY sequence_no",(r,n)->s.map("event",s.decode(r.getString(1)),"evaluation",s.decode(r.getString(2)),"receivedAt",PortalStore.timestamp(r,"received_at")),uid,id.toString()));
  }
  @GetMapping("/{id}") Object get(Authentication auth,@PathVariable UUID id) { return read(owner(auth),id); }

  @GetMapping("/{id}/observations")
  @SuppressWarnings("unchecked")
  Object observations(Authentication auth,@PathVariable UUID id) {
    var attempt=read(owner(auth),id);
    var events=(List<Map<String,Object>>)attempt.get("events");
    List<Object> observations=new ArrayList<>();
    int decisions=0,correct=0;
    for(var row:events) {
      var event=(Map<String,Object>)row.get("event"); var evaluation=(Map<String,Object>)row.get("evaluation");
      if(!"move".equals(event.get("kind"))) continue;
      decisions++; if(Boolean.TRUE.equals(evaluation.get("correct"))) correct++;
      if(Boolean.TRUE.equals(evaluation.get("firstResponse"))) observations.add(s.map("eventId",event.get("eventId"),"sequence",event.get("sequence"),"occurredAt",event.get("occurredAt"),"receivedAt",row.get("receivedAt"),"elapsedMs",event.get("elapsedMs"),"kcId",KC,"response",Boolean.TRUE.equals(evaluation.get("correct"))?1:0,"opportunity",evaluation.get("opportunity")));
    }
    return s.map("schemaVersion",1,"clientAttemptId",id,"metadata",attempt.get("metadata"),"modelStatus","checkpoint_not_configured","mastery",null,
        "knowledgeComponent",s.map("id",KC,"description","Thực hiện phép đổi chỗ kế tiếp hợp lệ trong Bubble Sort"),
        "support",s.map("automaticKeeps",true,"immediateFeedback",true,"fixedTailVisible",true,"hintsAvailable",false),
        "decisions",decisions,"correctDecisions",correct,"retryDecisions",decisions-observations.size(),"observations",observations,
        "limitations",List.of("Only first responses per swap opportunity are model observations; retries stay in raw logs.","Automatic keeps, pass changes and completion are not learner answers.","This task does not measure an explicit keep/no-swap decision or unassisted mastery.","Semantic KC IDs require a verified mapping/training pipeline before simpleKT inference."));
  }
}
