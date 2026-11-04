package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learner")
@Transactional
public class LearnerController {
  final PortalStore s;
  final UserStore users;
  public LearnerController(PortalStore s, UserStore users) { this.s=s; this.users=users; }
  String user(Authentication a) {
    String id=users.byEmail(a.getName()).id();
    s.db().queryForList("SELECT id FROM app_users WHERE id=? FOR UPDATE",id);
    return id;
  }
  void enrolled(String uid,String cid) {
    if(s.db().queryForObject("SELECT COUNT(*) FROM enrollments WHERE user_id=? AND class_id=?",Integer.class,uid,cid)!=1) throw ApiException.missing();
  }
  Object classroom(String uid,String cid) {
    enrolled(uid,cid);
    return s.db().queryForObject("SELECT c.*,u.name AS teacher FROM classrooms c JOIN app_users u ON u.id=c.instructor_id WHERE c.id=?",
      (r,n)->s.map("id",cid,"title",r.getString("name"),"instructorName",r.getString("teacher"),"joinedAt",PortalStore.timestamp(r,"created_at")),cid);
  }
  @GetMapping("/classes") Object classes(Authentication a) {
    String uid=user(a);
    return s.db().query("SELECT class_id FROM enrollments WHERE user_id=? ORDER BY class_id",(r,n)->r.getString(1),uid).stream().map(cid->classroom(uid,cid)).toList();
  }
  record Join(@NotBlank @Pattern(regexp="[A-Za-z0-9]{8}") String code) {}
  @PostMapping("/classes/join") @ResponseStatus(org.springframework.http.HttpStatus.CREATED) Object join(Authentication a,@Valid @RequestBody Join v) {
    String uid=user(a);
    String cid=s.db().query("SELECT id FROM classrooms WHERE invite_code=?",(r,n)->r.getString(1),v.code().toUpperCase(Locale.ROOT)).stream().findFirst().orElseThrow(()->ApiException.bad("Mã mời không tồn tại."));
    if(s.db().queryForObject("SELECT COUNT(*) FROM enrollments WHERE user_id=? AND class_id=?",Integer.class,uid,cid)>0) throw ApiException.bad("Bạn đã tham gia lớp này.");
    s.db().update("INSERT INTO enrollments(id,class_id,user_id) VALUES (?,?,?)",s.id(),cid,uid);
    return classroom(uid,cid);
  }
  @DeleteMapping("/classes/{cid}") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) void leave(Authentication a,@PathVariable String cid) {
    String uid=user(a);enrolled(uid,cid);
    s.db().update("DELETE FROM enrollments WHERE user_id=? AND class_id=?",uid,cid);
  }
  String deadline(Object date) {
    String text=Objects.toString(date,"");
    return text.isEmpty()?"":LocalDate.parse(text).plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant().toString();
  }
  void beforeDue(Map<String,Object> item) {
    String due=deadline(item.get("due"));
    if(!due.isEmpty()&&!Instant.now().isBefore(Instant.parse(due))) throw ApiException.bad("Bài đã quá hạn. Không thể nộp thêm lượt làm bài.");
  }
  @SuppressWarnings("unchecked")
  Map<String,Object> publicItem(Map<String,Object> item,boolean quiz, boolean reveal) {
    var out=s.map("id",item.get("id"),"classroomId",item.get("classId"),"title",item.get("title"),"description",item.get("description"),"dueAt",deadline(item.get("due")),"kind",quiz?"quiz":"challenge","lessonIds",quiz?List.of():item.get("lessonIds"));
    if(!quiz) out.put("lessonConfigs",item.get("lessonConfigs"));
    List<Object> questions=new ArrayList<>();
    if(quiz) for(var q:(List<Map<String,Object>>)item.get("questions")) {
      var options=(List<Map<String,Object>>)q.get("options");
      int correct=-1;for(int i=0;i<options.size();i++)if(options.get(i).get("id").equals(q.get("correctOptionId")))correct=i;
      var pq=s.map("id",q.get("id"),"prompt",q.get("prompt"),"options",options.stream().map(o->o.get("text")).toList(),"points",q.get("points"));
      if(reveal){pq.put("correctIndex",correct);pq.put("explanation",q.get("explanation"));}
      questions.add(pq);
    }
    out.put("questions",questions);return out;
  }
  Map<String,Object> item(String uid,String id) {
    var rows=s.db().query("SELECT * FROM quizzes WHERE id=? AND status='Published'",(r,n)->s.quiz(r),id);
    boolean quiz=!rows.isEmpty();
    if(!quiz)rows=s.db().query("SELECT * FROM assignments WHERE id=? AND status='Active'",(r,n)->s.assignment(r),id);
    var item=rows.stream().findFirst().orElseThrow(ApiException::missing);
    enrolled(uid,(String)item.get("classId"));
    item.put("isQuiz",quiz);return item;
  }
  @GetMapping("/classes/{cid}/assignments") Object assignments(Authentication a,@PathVariable String cid) {
    String uid=user(a);enrolled(uid,cid);
    var result=new ArrayList<Object>();
    s.db().query("SELECT * FROM quizzes WHERE class_id=? AND status='Published' ORDER BY created_at",(r,n)->s.quiz(r),cid).forEach(q->result.add(publicItem(q,true,false)));
    s.db().query("SELECT * FROM assignments WHERE class_id=? AND status='Active' ORDER BY title",(r,n)->s.assignment(r),cid).forEach(q->{
      var out=publicItem(q,false,false);
      out.put("completedLessonIds",s.db().query("SELECT lesson_id FROM assignment_completions WHERE assignment_id=? AND user_id=?",(r,n)->r.getString(1),q.get("id"),uid).stream().filter(s.catalog()::isCurrent).toList());
      result.add(out);
    });
    return result;
  }
  @GetMapping("/assignments/{id}") Object assignment(Authentication a,@PathVariable String id) {
    String uid=user(a);var q=item(uid,id);
    boolean reveal=s.db().queryForObject("SELECT COUNT(*) FROM quiz_attempts WHERE user_id=? AND quiz_id=?",Integer.class,uid,id)>0;
    var out=publicItem(q,(boolean)q.get("isQuiz"),reveal);
    if(!(boolean)q.get("isQuiz")) out.put("completedLessonIds",s.db().query("SELECT lesson_id FROM assignment_completions WHERE assignment_id=? AND user_id=?",(r,n)->r.getString(1),id,uid).stream().filter(s.catalog()::isCurrent).toList());
    return out;
  }
  record Answer(@NotBlank String questionId, @Min(0) @Max(5) Integer selectedIndex) {}
  record Submit(@NotNull UUID clientAttemptId,@NotNull @Size(max=50) List<@NotNull @Valid Answer> answers) {}
  @PostMapping("/assignments/{id}/attempts")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  @SuppressWarnings("unchecked")
  Object submit(Authentication a,@PathVariable String id,@Valid @RequestBody Submit v) {
    String uid=user(a);var q=item(uid,id);
    if(!(boolean)q.get("isQuiz"))throw ApiException.bad("Hãy hoàn thành các màn chơi được giao.");
    var old=s.db().query("SELECT quiz_id,result FROM quiz_attempts WHERE user_id=? AND client_id=?",(r,n)->s.map("quizId",r.getString(1),"result",s.decode(r.getString(2))),uid,v.clientAttemptId().toString());
    if(!old.isEmpty()) {
      if(!id.equals(old.getFirst().get("quizId")))throw ApiException.bad("Mã lượt nộp đã được sử dụng.");
      return old.getFirst().get("result");
    }
    beforeDue(q);
    var questions=(List<Map<String,Object>>)q.get("questions");
    Map<String,Integer> input=new HashMap<>();
    Set<String> ids=new HashSet<>();questions.forEach(question->ids.add((String)question.get("id")));
    Set<String> seen=new HashSet<>();
    for(var answer:v.answers()) {
      if(!ids.contains(answer.questionId())||!seen.add(answer.questionId()))throw ApiException.bad("Câu trả lời bị trùng hoặc không thuộc bài.");
      input.put(answer.questionId(),answer.selectedIndex());
    }
    int correct=0,earned=0,totalPoints=0;var answers=new ArrayList<>();
    for(var question:questions) {
      var options=(List<Map<String,Object>>)question.get("options");
      Integer index=input.get(question.get("id"));
      if(index!=null&&index>=options.size())throw ApiException.bad("Lựa chọn không hợp lệ.");
      int points=((Number)question.get("points")).intValue();totalPoints+=points;
      if(index!=null&&options.get(index).get("id").equals(question.get("correctOptionId"))){correct++;earned+=points;}
      answers.add(s.map("questionId",question.get("id"),"selectedIndex",index));
    }
    int score=(int)Math.round(earned*100.0/totalPoints);String attempt=s.id();
    var result=s.map("id",attempt,"assignmentId",id,"submittedAt",Instant.now().toString(),"answers",answers,"correctCount",correct,"total",questions.size(),"scorePercent",score);
    s.db().update("INSERT INTO quiz_attempts(id,user_id,quiz_id,client_id,result,score) VALUES (?,?,?,?,?,?)",attempt,uid,id,v.clientAttemptId().toString(),s.encode(result),score);
    return result;
  }
  @GetMapping("/assignments/{id}/attempts") Object attempts(Authentication a,@PathVariable String id) {
    String uid=user(a);var q=item(uid,id);
    if(!(boolean)q.get("isQuiz"))return List.of();
    return s.db().query("SELECT result FROM quiz_attempts WHERE user_id=? AND quiz_id=? ORDER BY submitted_at DESC,id DESC",(r,n)->s.decode(r.getString(1)),uid,id);
  }
}
