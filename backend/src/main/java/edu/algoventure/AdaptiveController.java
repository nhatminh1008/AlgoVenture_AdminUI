package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/me/practice")
public class AdaptiveController {
  final PortalStore s; final UserStore users; final PracticeCatalog catalog; final AdaptiveGateway gateway;
  public AdaptiveController(PortalStore s,UserStore users,PracticeCatalog catalog,AdaptiveGateway gateway) {
    this.s=s; this.users=users; this.catalog=catalog; this.gateway=gateway;
  }
  String owner(Authentication auth) { return users.byEmail(auth.getName()).id(); }
  record Recommend(@NotNull UUID clientRequestId,UUID assignmentId) {}

  List<PracticeCatalog.Exercise> eligible(String uid,UUID assignmentId) {
    if(assignmentId!=null) {
      var assignments=s.db().queryForList("SELECT a.lesson_ids FROM assignments a JOIN enrollments e ON e.class_id=a.class_id WHERE a.id=? AND e.user_id=? AND a.status='Active'",assignmentId.toString(),uid);
      if(assignments.isEmpty() || !((List<?>)s.decode((String)assignments.getFirst().get("lesson_ids"))).contains("bubble")) throw ApiException.missing();
    }
    // Bubble is foundation-first and has no built-in prerequisites; respect admin additions.
    var lessons=s.db().queryForList("SELECT config FROM algorithms WHERE id='bubble' AND status='Published'");
    if(lessons.isEmpty()) return List.of();
    var config=(Map<?,?>)s.decode((String)lessons.getFirst().get("config"));
    var prerequisites=(List<?>)config.get("prerequisites");
    if(prerequisites!=null) for(Object id:prerequisites)
      if(s.db().queryForObject("SELECT COUNT(*) FROM lesson_completions WHERE user_id=? AND lesson_id=?",Integer.class,uid,id)==0) return List.of();
    return catalog.all();
  }
  @GetMapping("/exercises")
  Object exercises(Authentication auth,@RequestParam(required=false) UUID assignmentId) {
    return s.map("exercises",eligible(owner(auth),assignmentId));
  }

  @PostMapping("/recommendations")
  @Transactional
  Object recommend(Authentication auth,@Valid @RequestBody Recommend request) {
    String uid=owner(auth),context=s.encode(s.map("assignmentId",request.assignmentId()));
    s.db().queryForList("SELECT id FROM app_users WHERE id=? FOR UPDATE",uid);
    var old=s.db().queryForList("SELECT context_json,response_json FROM adaptive_recommendations WHERE user_id=? AND client_request_id=?",uid,request.clientRequestId().toString());
    if(!old.isEmpty()) {
      if(!old.getFirst().get("context_json").equals(context)) throw LearningLogController.conflict("Mã yêu cầu đã được dùng trong ngữ cảnh khác.");
      return s.decode((String)old.getFirst().get("response_json"));
    }
    var exercises=eligible(uid,request.assignmentId());
    // Arrival order is deterministic across offline attempts; sequence orders decisions within each upload.
    var rows=s.db().queryForList("SELECT i.evaluation FROM learning_interactions i JOIN learning_attempts a ON a.user_id=i.user_id AND a.client_attempt_id=i.client_attempt_id WHERE i.user_id=? AND i.kind='move' AND a.lesson_id='bubble' ORDER BY a.received_at DESC,a.client_attempt_id DESC,i.sequence_no DESC LIMIT 2000",uid);
    Collections.reverse(rows);
    var history=new ArrayList<AdaptiveGateway.Observation>();
    for(var row:rows) {
      var e=(Map<?,?>)s.decode((String)row.get("evaluation"));
      if(!Boolean.TRUE.equals(e.get("firstResponse"))) continue;
      var before=(Map<?,?>)e.get("before");
      var items=((List<?>)before.get("items")).stream().map(o->{var item=(Map<?,?>)o; return new BubbleTrace.Item(((Number)item.get("id")).intValue(),((Number)item.get("value")).intValue());}).toList();
      var snapshot=new BubbleTrace.Snapshot(items,((Number)before.get("pair")).intValue(),((Number)before.get("end")).intValue(),((Number)before.get("pass")).intValue());
      history.add(new AdaptiveGateway.Observation(PracticeCatalog.questionId(snapshot),LearningLogController.KC,Boolean.TRUE.equals(e.get("correct"))?1:0));
    }
    AdaptiveGateway.Result result;
    if(exercises.isEmpty()) result=AdaptiveGateway.unavailable("model_not_ready","no_eligible_exercises");
    else if(history.isEmpty()) result=AdaptiveGateway.unavailable("insufficient_history","no_observations");
    else result=gateway.recommend(new AdaptiveGateway.Request(1,history,exercises.stream().map(e->new AdaptiveGateway.Candidate(e.id(),e.questionId(),e.kcId())).toList()));
    String id=s.id();
    var response=s.map("id",id,"status",result.status(),"exerciseId",result.status().equals("ready")?result.exerciseId():null,
        "predictedCorrectness",result.status().equals("ready")?result.predictedCorrectness():null,
        "modelVersion",result.modelVersion(),"policyVersion",result.policyVersion(),"reasonCode",result.reasonCode(),
        "predictionTarget","first_swap_opportunity","observationCount",history.size(),
        "historyUsed",result.historyUsed(),"historySkipped",result.historySkipped());
    s.db().update("INSERT INTO adaptive_recommendations(id,user_id,client_request_id,context_json,response_json) VALUES (?,?,?,?,?)",id,uid,request.clientRequestId().toString(),context,s.encode(response));
    return response;
  }
}
