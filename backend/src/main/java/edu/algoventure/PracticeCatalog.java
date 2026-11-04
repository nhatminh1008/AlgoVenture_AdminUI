package edu.algoventure;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.stereotype.Component;

/** Versioned practice items. Difficulty labels are editorial, not calibrated estimates. */
@Component
public class PracticeCatalog {
  public record Exercise(String id, int version, String lessonId, String kcId, String title,
      String description, String difficulty, List<Integer> input) {
    public String questionId() { return PracticeCatalog.questionId(new BubbleTrace(input).snapshot()); }
  }
  private final List<Exercise> items = List.of(
      new Exercise("bubble-short-v1",1,"bubble",LearningLogController.KC,"Đổi chỗ cơ bản",
          "Luyện chọn phép đổi chỗ kế tiếp với bốn số.","easy",List.of(4,1,3,2)),
      new Exercise("bubble-duplicates-v1",1,"bubble",LearningLogController.KC,"Các số bằng nhau",
          "Luyện đổi chỗ trên mảng có giá trị trùng nhau.","medium",List.of(3,1,3,2,1)),
      new Exercise("bubble-mixed-v1",1,"bubble",LearningLogController.KC,"Thử thách số âm",
          "Luyện chuỗi đổi chỗ với số âm và số dương.","hard",List.of(5,-2,3,0,-1,4,2)));

  public List<Exercise> all() { return items; }
  public Exercise get(String id) {
    return items.stream().filter(e -> e.id().equals(id)).findFirst().orElseThrow(ApiException::missing);
  }
  // The prediction target is the FIRST decision on this exact board, not whole-run success.
  public static String questionId(BubbleTrace.Snapshot board) {
    String canonical=board.items().stream().map(i->Integer.toString(i.value())).reduce((a,b)->a+","+b).orElse("")
        +"|"+board.pair()+"|"+board.end()+"|"+board.pass();
    try {
      return "bubble-board-v1:"+HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
    } catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
  }
}
