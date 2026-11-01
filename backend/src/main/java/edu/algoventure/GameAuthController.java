package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/auth")
@Transactional
public class GameAuthController {
  final PortalStore store; final UserStore users; final PasswordEncoder passwords;
  final AuthenticationManager manager; final LearnerSessions sessions;
  public GameAuthController(PortalStore store, UserStore users, PasswordEncoder passwords, AuthenticationManager manager, LearnerSessions sessions) {
    this.store=store; this.users=users; this.passwords=passwords; this.manager=manager; this.sessions=sessions;
  }
  record Register(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(min=6,max=72) String password, @NotBlank @Size(max=100) String fullName) {
    Register { if(email!=null) email=email.trim(); }
  }
  record Login(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(max=100) String password) {
    Login { if(email!=null) email=email.trim(); }
  }

  @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
  Object register(@Valid @RequestBody Register body) {
    if(body.password().getBytes(StandardCharsets.UTF_8).length>72) throw ApiException.bad("Mật khẩu tối đa 72 byte UTF-8.");
    String id=store.id();
    store.db().update("INSERT INTO app_users(id,email,name,password_hash,role,status) VALUES (?,?,?,?,'learner','Active')",id,body.email().trim().toLowerCase(Locale.ROOT),body.fullName().trim(),passwords.encode(body.password()));
    store.audit(id,"learner.register");
    return sessions.issue(users.byId(id));
  }
  @PostMapping("/login") Object login(@Valid @RequestBody Login body) {
    try {
      var auth=manager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(body.email().trim().toLowerCase(Locale.ROOT),body.password()));
      return sessions.issue(users.byEmail(auth.getName()));
    } catch(AuthenticationException ex) { throw new ApiException(HttpStatus.UNAUTHORIZED,"Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa."); }
  }
  @GetMapping("/me") Object me(Authentication auth) { return sessions.account(users.byEmail(auth.getName())); }
  @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
  void logout(@RequestHeader("Authorization") String authorization) { sessions.revoke(authorization); }
}
