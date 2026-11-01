package edu.algoventure;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Revocable Bearer sessions shared by the game and Classroom. Only hashes are stored. */
@Service
@Transactional
public class LearnerSessions {
  static final long LIFETIME_MS = 8 * 60 * 60 * 1000;
  private final PortalStore store;
  private final UserStore users;
  private final SecureRandom random = new SecureRandom();

  public LearnerSessions(PortalStore store, UserStore users) { this.store = store; this.users = users; }

  static String hash(String token) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
    catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
  }

  void profile(UserStore.Account account) {
    store.db().queryForList("SELECT id FROM app_users WHERE id=? FOR UPDATE", account.id());
    if (store.db().queryForObject("SELECT COUNT(*) FROM learner_profiles WHERE user_id=?", Integer.class, account.id()) == 0)
      store.db().update("INSERT INTO learner_profiles(user_id,display_name) VALUES (?,?)", account.id(), account.name().substring(0, Math.min(24, account.name().length())));
  }

  Map<String,Object> account(UserStore.Account account) {
    profile(account);
    Long id = store.db().queryForObject("SELECT game_id FROM learner_profiles WHERE user_id=?", Long.class, account.id());
    return store.map("userId", id, "email", account.email(), "fullName", account.name(), "role", "LEARNER");
  }

  Map<String,Object> issue(UserStore.Account account) {
    requireLearner(account);
    byte[] bytes = new byte[32]; random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    Instant expires = Instant.now().plusMillis(LIFETIME_MS);
    store.db().update("DELETE FROM learner_sessions WHERE expires_at<=CURRENT_TIMESTAMP");
    store.db().update("INSERT INTO learner_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)", hash(token), account.id(), Timestamp.from(expires));
    var response = account(account);
    response.putAll(store.map("token",token,"tokenType","Bearer","expiresIn",LIFETIME_MS,"expiresAt",expires.toEpochMilli()));
    return response;
  }

  UserStore.Account verify(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() > 512)
      throw new ApiException(HttpStatus.UNAUTHORIZED,"Vui lòng đăng nhập để tiếp tục.");
    var ids = store.db().query("SELECT user_id FROM learner_sessions WHERE token_hash=? AND expires_at>CURRENT_TIMESTAMP", (r,n)->r.getString(1), hash(authorization.substring(7)));
    if (ids.isEmpty()) throw new ApiException(HttpStatus.UNAUTHORIZED,"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    var account = users.byId(ids.getFirst()); requireLearner(account); return account;
  }

  static void requireLearner(UserStore.Account account) {
    if (!account.role().equals("learner") || !account.status().equals("Active"))
      throw new ApiException(HttpStatus.FORBIDDEN,"Tài khoản học viên không có quyền truy cập hoặc đã bị khóa.");
  }

  void revoke(String authorization) { store.db().update("DELETE FROM learner_sessions WHERE token_hash=?", hash(authorization.substring(7))); }
}
