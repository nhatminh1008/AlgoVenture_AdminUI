package edu.algoventure;

import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;

class AdaptiveGatewayTest {
  final ObjectMapper json=new ObjectMapper();
  final AdaptiveGateway.Request request=new AdaptiveGateway.Request(1,
      List.of(new AdaptiveGateway.Observation("known","bubble.next_swap.v1",1)),
      List.of(new AdaptiveGateway.Candidate("exercise","known","bubble.next_swap.v1")));

  @Test void experimentalWireResponsePreservesDisclosure() throws Exception {
    var response=new AdaptiveGateway.Result("ready","exercise",.68,"bubble-experimental-test",
        "target-correctness-v1:0.70","experimental_target_correctness",1,0);
    assertEquals(response,call(response));
  }

  @Test void inconsistentExperimentalCountsNeverBecomeReady() throws Exception {
    for(Integer skipped:Arrays.asList(null,-1,1,Integer.MAX_VALUE)) {
      var response=new AdaptiveGateway.Result("ready","exercise",.68,"bubble-experimental-test",
          "target-correctness-v1:0.70","experimental_target_correctness",1,skipped);
      assertEquals("invalid_model_response",call(response).reasonCode());
    }
  }

  AdaptiveGateway.Result call(AdaptiveGateway.Result result) throws Exception {
    // Blocking loopback socket avoids the Windows AF_UNIX selector restriction.
    try(var server=new ServerSocket(0,1,InetAddress.getByName("127.0.0.1"))) {
      server.setSoTimeout(4000);
      var served=CompletableFuture.runAsync(()->{
        try(var socket=server.accept()) {
          socket.setSoTimeout(4000);
          var reader=new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.UTF_8));
          String line; int length=0;
          while((line=reader.readLine())!=null && !line.isEmpty())
            if(line.toLowerCase(Locale.ROOT).startsWith("content-length:")) length=Integer.parseInt(line.substring(15).trim());
          for(int i=0;i<length;i++) if(reader.read()==-1) throw new EOFException("Truncated request");
          byte[] bytes=json.writeValueAsBytes(result);
          var output=socket.getOutputStream();
          output.write(("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: "+bytes.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
          output.write(bytes); output.flush();
        } catch(Exception e) { throw new CompletionException(e); }
      });
      var response=new AdaptiveGateway("http://127.0.0.1:"+server.getLocalPort(),json).recommend(request);
      served.get(5,TimeUnit.SECONDS);
      return response;
    }
  }
}
