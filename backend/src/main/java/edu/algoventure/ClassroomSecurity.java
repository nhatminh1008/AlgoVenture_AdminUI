package edu.algoventure;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class ClassroomSecurity {
  @Bean @Order(1)
  SecurityFilterChain classroomFilterChain(HttpSecurity http, LearnerSessions sessions) throws Exception {
    return http.securityMatcher("/api/learner/**", "/api/game/**")
        // Game and Classroom share local Bearer sessions, independent of portal cookies.
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/game/auth/register", "/api/game/auth/login").permitAll().anyRequest().hasRole("LEARNER"))
        .exceptionHandling(errors -> errors.authenticationEntryPoint((q,r,e) -> SecurityConfig.error(r,401,"Vui lòng đăng nhập để tiếp tục.")).accessDeniedHandler((q,r,e) -> SecurityConfig.error(r,403,"Bạn không có quyền truy cập.")))
        .addFilterBefore(new OncePerRequestFilter() {
          @Override protected void doFilterInternal(HttpServletRequest q,HttpServletResponse r,FilterChain chain) throws ServletException, IOException {
            String path = q.getRequestURI().substring(q.getContextPath().length());
            if (q.getMethod().equals("POST") && java.util.Set.of("/api/game/auth/register", "/api/game/auth/login").contains(path)) { chain.doFilter(q,r); return; }
            String authorization = q.getHeader("Authorization");
            if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() > 8192) {
              SecurityConfig.error(r,401,"Hãy đăng nhập game để vào lớp học."); return;
            }
            try {
              var account = sessions.verify(authorization);
              var context = SecurityContextHolder.createEmptyContext();
              context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(account.email(),null,AuthorityUtils.createAuthorityList("ROLE_LEARNER")));
              SecurityContextHolder.setContext(context);
            } catch (ApiException ex) {
              SecurityConfig.error(r,ex.status.value(),ex.getMessage()); return;
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
              SecurityConfig.error(r,409,"Liên kết tài khoản đang thay đổi. Hãy thử lại."); return;
            }
            chain.doFilter(q,r);
          }
        },AnonymousAuthenticationFilter.class).build();
  }
}
