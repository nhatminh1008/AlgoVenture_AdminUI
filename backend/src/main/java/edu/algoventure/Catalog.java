package edu.algoventure;

import com.fasterxml.jackson.databind.*;
import java.io.IOException;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class Catalog {
  public final JsonNode topics;

  public Catalog(ObjectMapper json) throws IOException {
    try (var input = new ClassPathResource("curriculum.json").getInputStream()) {
      topics = json.readTree(input);
    }
  }

  public Set<String> lessons(String topicId) {
    for (JsonNode topic : topics)
      if (topic.path("id").asText().equals(topicId)) {
        Set<String> ids = new HashSet<>();
        topic.path("lessons").forEach(l -> ids.add(l.get(0).asText()));
        return ids;
      }
    throw ApiException.bad("Chủ đề không hợp lệ.");
  }
}
