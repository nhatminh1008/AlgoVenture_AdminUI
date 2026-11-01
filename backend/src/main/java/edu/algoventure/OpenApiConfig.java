package edu.algoventure;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean
  OpenAPI portalApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("AlgoVenture API")
                .version("v1")
                .description(
                    "Thử API: (1) Execute GET /api/auth/csrf. (2) Execute POST /api/auth/login với"
                        + " email và password. (3) Execute lại GET /api/auth/csrf sau mỗi lần đăng"
                        + " nhập/đăng xuất. Sau đó thử các API phù hợp với vai trò. Swagger tự gửi"
                        + " cookie phiên và header CSRF. Không cần nhập cookie vào Authorize. Dùng"
                        + " cùng hostname trong suốt phiên."))
        .schemaRequirement(
            "session",
            new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE)
                .name("JSESSIONID")
                .description("Cookie được trình duyệt lưu sau POST /api/auth/login."));
  }

  @Bean
  OpenApiCustomizer portalOperations() {
    return api -> {
      api.schemaRequirement("game", new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").description("Bearer token returned by /api/game/auth/login or register; revocable server session."));
      // Logout is handled by Spring Security's filter, so controller scanning cannot discover it.
      api.path(
          "/api/auth/logout",
          new PathItem()
              .post(
                  new Operation()
                      .operationId("logout")
                      .summary("Đăng xuất")
                      .responses(
                          new ApiResponses()
                              .addApiResponse(
                                  "204", new ApiResponse().description("Đã đăng xuất")))));
      api.getPaths()
          .forEach(
              (path, item) ->
                  item.readOperations()
                      .forEach(
                          operation -> {
                            String tag =
                                path.startsWith("/api/admin/")
                                    ? "Admin"
                                    : path.startsWith("/api/instructor/") ? "Instructor" : (path.startsWith("/api/learner/") || path.startsWith("/api/game/")) ? "Learner" : "Auth";
                            operation.setTags(java.util.List.of(tag));
                            if (!java.util.Set.of(
                                    "/api/health", "/api/auth/csrf", "/api/auth/login", "/api/game/auth/login", "/api/game/auth/register")
                                .contains(path)) {
                              operation.addSecurityItem(
                                  new SecurityRequirement().addList((path.startsWith("/api/learner/") || path.startsWith("/api/game/")) ? "game" : "session"));
                            }
                          }));
    };
  }
}
