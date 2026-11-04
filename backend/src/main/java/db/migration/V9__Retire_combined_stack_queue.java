package db.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/** Upgrade assigned content; old result rows remain available as historical evidence. */
public class V9__Retire_combined_stack_queue extends BaseJavaMigration {
  private static final Map<String,List<String>> REPLACEMENTS = Map.of(
      "stack", List.of("stack-push", "stack-pop", "stack-peek"),
      "queue", List.of("queue-enqueue", "queue-dequeue", "queue-peek"));

  @Override
  public void migrate(Context context) throws Exception {
    var db = new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true));
    var json = new ObjectMapper();
    for (var row : db.queryForList("SELECT id,lesson_ids,lesson_configs FROM assignments")) {
      var original = json.readTree((String)row.get("lesson_ids"));
      var ids = new LinkedHashSet<String>();
      original.forEach(id -> ids.addAll(REPLACEMENTS.getOrDefault(id.asText(), List.of(id.asText()))));
      ArrayNode upgraded = json.valueToTree(ids);
      var configs = (ObjectNode)json.readTree((String)row.get("lesson_configs"));
      boolean removed = configs.has("stack") || configs.has("queue");
      configs.remove(List.of("stack", "queue"));
      if (!original.equals(upgraded) || removed)
        db.update("UPDATE assignments SET lesson_ids=?,lesson_configs=? WHERE id=?",
            upgraded.toString(), configs.toString(), row.get("id"));
    }
    for (var row : db.queryForList("SELECT id,config FROM algorithms")) {
      var config = (ObjectNode)json.readTree((String)row.get("config"));
      if (config.get("prerequisites") instanceof ArrayNode original) {
        var ids = new LinkedHashSet<String>();
        original.forEach(id -> ids.addAll(REPLACEMENTS.getOrDefault(id.asText(), List.of(id.asText()))));
        ids.remove((String)row.get("id"));
        ArrayNode upgraded = json.valueToTree(ids);
        if (!original.equals(upgraded)) {
          config.set("prerequisites", upgraded);
          db.update("UPDATE algorithms SET config=? WHERE id=?", config.toString(), row.get("id"));
        }
      }
    }
    db.update("UPDATE algorithms SET status='Retired' WHERE id IN ('stack','queue')");
  }
}
