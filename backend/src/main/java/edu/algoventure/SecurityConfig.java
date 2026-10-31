package edu.algoventure;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Locale;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.*;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder passwords() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  AuthenticationManager authenticationManager(UserStore users, PasswordEncoder encoder) {
    var provider = new DaoAuthenticationProvider(users);
    provider.setPasswordEncoder(encoder);
    return new ProviderManager(provider);
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, UserStore users) throws Exception {
    var csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
    http.csrf(
            c ->
                c.csrfTokenRepository(csrf)
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/health")
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/instructor/**")
                    .hasRole("INSTRUCTOR")
                    .requestMatchers("/api/**")
                    .authenticated()
                    .anyRequest()
                    .denyAll())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint((q, r, x) -> error(r, 401, "Vui lòng đăng nhập."))
                    .accessDeniedHandler(
                        (q, r, x) ->
                            error(
                                r,
                                403,
                                "Bạn không có quyền thực hiện thao tác này hoặc phiên bảo vệ đã hết"
                                    + " hạn.")))
        .logout(
            l ->
                l.logoutUrl("/api/auth/logout")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                    .logoutSuccessHandler((q, r, a) -> r.setStatus(204)))
        .addFilterAfter(
            new OncePerRequestFilter() {
              @Override
              protected void doFilterInternal(
                  HttpServletRequest q, HttpServletResponse r, FilterChain chain)
                  throws ServletException, IOException {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null
                    && auth.isAuthenticated()
                    && !auth.getName().equals("anonymousUser")) {
                  try {
                    var account = users.byEmail(auth.getName());
                    if (!account.status().equals("Active")
                        || auth.getAuthorities().stream()
                            .noneMatch(
                                a ->
                                    a.getAuthority()
                                        .equals("ROLE_" + account.role().toUpperCase(Locale.ROOT))))
                      throw ApiException.missing();
                  } catch (ApiException ex) {
                    if (q.getSession(false) != null) q.getSession(false).invalidate();
                    SecurityContextHolder.clearContext();
                    error(
                        r,
                        401,
                        "Tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.");
                    return;
                  }
                }
                chain.doFilter(q, r);
              }
            },
            AnonymousAuthenticationFilter.class);
    return http.build();
  }

  static void error(HttpServletResponse response, int status, String message) throws IOException {
    response.setStatus(status);
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write("{\"message\":\"" + message + "\"}");
  }
}
