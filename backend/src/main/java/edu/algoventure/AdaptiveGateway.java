package edu.algoventure;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdaptiveGateway {
  public record Observation(String questionId,String kcId,int response) {}
  public record Candidate(String id,String questionId,String kcId) {}
  public record Request(int schemaVersion,List<Observation> history,List<Candidate> candidates) {}
  public record Result(String status,String exerciseId,Double predictedCorrectness,String modelVersion,
      String policyVersion,String reasonCode,Integer historyUsed,Integer historySkipped) {
    public Result(String status,String exerciseId,Double predictedCorrectness,String modelVersion,String policyVersion,String reasonCode) {
      this(status,exerciseId,predictedCorrectness,modelVersion,policyVersion,reasonCode,null,null);
    }
  }
  final String url; final ObjectMapper json;
  public AdaptiveGateway(@Value("${app.ai.url:}") String url,ObjectMapper json) { this.url=url; this.json=json; }
  public Result recommend(Request input) {
    if(url.isBlank()) return unavailable("model_not_ready","model_not_configured");
    HttpURLConnection connection=null;
    try {
      connection=(HttpURLConnection)URI.create(url.replaceAll("/+$","")+"/v1/recommendations").toURL().openConnection();
      connection.setConnectTimeout(2000); connection.setReadTimeout(3000);
      connection.setInstanceFollowRedirects(false); connection.setRequestMethod("POST");
      connection.setRequestProperty("Content-Type","application/json"); connection.setDoOutput(true);
      try(var output=connection.getOutputStream()) { output.write(json.writeValueAsBytes(input)); }
      if(connection.getResponseCode()!=200) return unavailable("temporarily_unavailable","service_unavailable");
      byte[] body;
      try(var stream=connection.getInputStream()) { body=stream.readNBytes(16385); }
      if(body.length>16384) return unavailable("temporarily_unavailable","invalid_model_response");
      var result=json.readValue(new String(body,StandardCharsets.UTF_8),Result.class);
      if(!Set.of("ready","model_not_ready","insufficient_history","temporarily_unavailable").contains(Objects.toString(result.status(),"")))
        return unavailable("temporarily_unavailable","invalid_model_response");
      if(result.status().equals("ready") && (result.predictedCorrectness()==null
          || !Double.isFinite(result.predictedCorrectness()) || result.predictedCorrectness()<0 || result.predictedCorrectness()>1
          || result.modelVersion()==null || result.modelVersion().isBlank()
          || !"target-correctness-v1:0.70".equals(result.policyVersion())
          || ("experimental_target_correctness".equals(result.reasonCode()) &&
              (result.historyUsed()==null || result.historyUsed()<1 || result.historyUsed()>input.history().size()
               || result.historySkipped()==null || result.historySkipped()<0 || result.historySkipped()>input.history().size()
               || result.historyUsed()+result.historySkipped()>input.history().size()))
          || input.candidates().stream().noneMatch(c->c.id().equals(result.exerciseId()))))
        return unavailable("temporarily_unavailable","invalid_model_response");
      return result;
    } catch(Exception e) { return unavailable("temporarily_unavailable","service_unavailable"); }
    finally { if(connection!=null) connection.disconnect(); }
  }
  static Result unavailable(String status,String reason) {
    return new Result(status,null,null,null,"target-correctness-v1:0.70",reason);
  }
}
