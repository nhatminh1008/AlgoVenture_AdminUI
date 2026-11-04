package db.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/** Preserve historical evidence while replacing the retired tree courses. */
public class V10__Split_tree_traversal extends BaseJavaMigration {
  private static List<String> current(String id) {
    return switch (id) {
      case "tree-traversal" -> List.of("tree-dfs", "tree-bfs");
      case "bst" -> List.of();
      default -> List.of(id);
    };
  }

  @Override
  public void migrate(Context context) throws Exception {
    var db = new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true));
    var json = new ObjectMapper();
    // Inherit the old publication/configuration, but never override explicit new rules.
    for (var old : db.queryForList("SELECT * FROM algorithms WHERE id='tree-traversal'")) {
      for (String id : List.of("tree-dfs", "tree-bfs")) {
        if (db.queryForObject("SELECT COUNT(*) FROM algorithms WHERE id=?", Integer.class, id) == 0)
          db.update("INSERT INTO algorithms(id,topic_id,name,difficulty,status,config) VALUES (?,?,?,?,?,?)",
              id, old.get("topic_id"), id.equals("tree-dfs") ? "Tree DFS" : "Tree BFS",
              old.get("difficulty"), "Published".equals(old.get("status")) ? "Published" : "Draft", old.get("config"));
      }
    }
    for (var row : db.queryForList("SELECT id,lesson_ids,lesson_configs,status FROM assignments")) {
      var original = json.readTree((String) row.get("lesson_ids"));
      var ids = new LinkedHashSet<String>();
      original.forEach(id -> ids.addAll(current(id.asText())));
      var configs = (ObjectNode) json.readTree((String) row.get("lesson_configs"));
      configs.remove(List.of("tree-traversal", "bst"));
      // A set containing only the removed BST foundation has no playable task left.
      String status = ids.isEmpty() && !original.isEmpty() ? "Closed" : (String) row.get("status");
      db.update("UPDATE assignments SET lesson_ids=?,lesson_configs=?,status=? WHERE id=?",
          json.writeValueAsString(ids), configs.toString(), status, row.get("id"));
    }
    for (var row : db.queryForList("SELECT id,config FROM algorithms")) {
      var config = (ObjectNode) json.readTree((String) row.get("config"));
      if (config.path("prerequisites").isArray()) {
        var ids = new LinkedHashSet<String>();
        config.path("prerequisites").forEach(id -> ids.addAll(current(id.asText())));
        ids.remove((String) row.get("id"));
        config.set("prerequisites", json.valueToTree(ids));
        db.update("UPDATE algorithms SET config=? WHERE id=?", config.toString(), row.get("id"));
      }
    }
    // Keep original completion rows and timestamps. Copy classroom evidence only
    // where the updated assignment actually requires that replacement lesson.
    for (var row : db.queryForList("SELECT * FROM assignment_completions WHERE lesson_id='tree-traversal'")) {
      var assigned = json.readTree(db.queryForObject("SELECT lesson_ids FROM assignments WHERE id=?", String.class, row.get("assignment_id")));
      for (String id : List.of("tree-dfs", "tree-bfs")) {
        boolean required = false;
        for (var item : assigned) if (id.equals(item.asText())) required = true;
        if (required && db.queryForObject("SELECT COUNT(*) FROM assignment_completions WHERE assignment_id=? AND user_id=? AND lesson_id=?",
            Integer.class, row.get("assignment_id"), row.get("user_id"), id) == 0)
          db.update("INSERT INTO assignment_completions(assignment_id,user_id,lesson_id,completed_at) VALUES (?,?,?,?)",
              row.get("assignment_id"), row.get("user_id"), id, row.get("completed_at"));
      }
    }
    db.update("UPDATE algorithms SET status='Retired' WHERE id IN ('tree-traversal','bst')");
  }
}
