package edu.algoventure;

import static edu.algoventure.PortalDtos.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthenticationManager manager;
  private final UserStore users;
  private final PasswordResetService passwordResetService;
  private final PortalStore store;
  private final PasswordEncoder passwords;

  public AuthController(
      AuthenticationManager manager,
      UserStore users,
      PasswordResetService passwordResetService,
      PortalStore store,
      PasswordEncoder passwords) {
    this.manager = manager;
    this.users = users;
    this.passwordResetService = passwordResetService;
    this.store = store;
    this.passwords = passwords;
  }

  record Login(@NotBlank @Email String email, @NotBlank @Size(max = 100) String password) {}

  @GetMapping("/health")
  Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/auth/csrf")
  Map<String, String> csrf(@io.swagger.v3.oas.annotations.Parameter(hidden = true) CsrfToken token) {
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

  @PostMapping("/auth/forgot-password")
  @ResponseStatus(HttpStatus.OK)
  @Operation(summary = "Request password reset", description = "Send password reset email")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Request processed"),
    @ApiResponse(responseCode = "400", description = "Invalid email")
  })
  Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest v) {
    String email = v.email().trim().toLowerCase(Locale.ROOT);
    try {
      var user = users.byEmail(email);
      // Only allow password reset for active accounts
      if (!user.status().equals("Active")) {
        // Don't reveal account status, just return success
        return Map.of("message", "If the email exists, a reset link has been sent.");
      }
      String token = passwordResetService.createResetToken(user.id());
      // TODO: Send email with reset link
      // For now, log to console (development mode)
      System.out.println("=== PASSWORD RESET TOKEN (Development Mode) ===");
      System.out.println("Email: " + email);
      System.out.println("Token: " + token);
      System.out.println("Reset Link: http://localhost:3000/reset-password?token=" + token);
      System.out.println("=============================================");
    } catch (ApiException ex) {
      // Email doesn't exist - don't reveal this, return success
    }
    return Map.of("message", "If the email exists, a reset link has been sent.");
  }

  @PostMapping("/auth/reset-password")
  @ResponseStatus(HttpStatus.OK)
  @Operation(summary = "Reset password", description = "Reset password with token")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Password reset successful"),
    @ApiResponse(responseCode = "400", description = "Invalid token or password")
  })
  Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest v) {
    if (!passwordResetService.validateToken(v.token())) {
      throw ApiException.bad("Invalid or expired reset token.");
    }

    String userId = passwordResetService.getUserIdByToken(v.token());
    var user = users.byId(userId);

    // Only allow reset for active accounts
    if (!user.status().equals("Active")) {
      throw ApiException.bad("Cannot reset password for inactive account. Please contact admin.");
    }

    // Validate password
    if (v.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw ApiException.bad("Password maximum 72 UTF-8 bytes.");

    // Update password
    store
        .db()
        .update(
            "UPDATE app_users SET password_hash=? WHERE id=?",
            passwords.encode(v.password()),
            userId);

    passwordResetService.markTokenAsUsed(v.token());

    return Map.of("message", "Password has been reset successfully. Please login with new password.");
  }
}
