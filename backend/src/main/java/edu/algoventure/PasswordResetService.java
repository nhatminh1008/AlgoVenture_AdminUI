package edu.algoventure;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PasswordResetService {
  private final JdbcTemplate db;
  private final PortalStore store;

  public PasswordResetService(JdbcTemplate db, PortalStore store) {
    this.db = db;
    this.store = store;
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }

  public String createResetToken(String userId) {
    String token = UUID.randomUUID().toString();
    String tokenHash = hashToken(token);
    Instant expiresAt = Instant.now().plusSeconds(3600); // 1 hour

    db.update(
        "INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)",
        UUID.randomUUID().toString(),
        userId,
        tokenHash,
        expiresAt);

    return token;
  }

  public boolean validateToken(String token) {
    String tokenHash = hashToken(token);
    Integer count =
        db.queryForObject(
            "SELECT COUNT(*) FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at > NOW()",
            Integer.class,
            tokenHash);
    return count != null && count > 0;
  }

  public String getUserIdByToken(String token) {
    String tokenHash = hashToken(token);
    return db.queryForObject(
        "SELECT user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at > NOW()",
        String.class,
        tokenHash);
  }

  public void markTokenAsUsed(String token) {
    String tokenHash = hashToken(token);
    db.update(
        "UPDATE password_reset_tokens SET used_at=NOW() WHERE token_hash=? AND used_at IS NULL",
        tokenHash);
  }

  public void cleanupExpiredTokens() {
    db.update("DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL");
  }
}
