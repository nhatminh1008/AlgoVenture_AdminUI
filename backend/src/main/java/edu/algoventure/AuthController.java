package edu.algoventure;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthenticationManager manager;
  private final UserStore users;

  public AuthController(AuthenticationManager manager, UserStore users) {
    this.manager = manager;
    this.users = users;
  }

  record Login(@NotBlank @Email String email, @NotBlank @Size(max = 100) String password) {}

  @GetMapping("/health")
  Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/auth/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/auth/login")
  UserStore.Account login(
      @Valid @RequestBody Login body, HttpServletRequest request, HttpServletResponse response) {
    try {
      Authentication auth =
          manager.authenticate(
              UsernamePasswordAuthenticationToken.unauthenticated(
                  body.email().trim().toLowerCase(Locale.ROOT), body.password()));
      if (request.getSession(false) != null) request.changeSessionId();
      var context = SecurityContextHolder.createEmptyContext();
      context.setAuthentication(auth);
      SecurityContextHolder.setContext(context);
      new HttpSessionSecurityContextRepository().saveContext(context, request, response);
      // Rotate the CSRF token across authentication boundaries.
      CookieCsrfTokenRepository.withHttpOnlyFalse().saveToken(null, request, response);
      return users.byEmail(auth.getName());
    } catch (AuthenticationException ex) {
      throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được kích hoạt.");
    }
  }

  @GetMapping("/auth/me")
  UserStore.Account me(Authentication auth) {
    return users.byEmail(auth.getName());
  }
}
