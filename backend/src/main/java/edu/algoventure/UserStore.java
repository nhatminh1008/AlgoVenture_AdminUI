package edu.algoventure;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Repository;

@Repository
public class UserStore implements UserDetailsService {
  private final JdbcTemplate db;

  public UserStore(JdbcTemplate db) {
    this.db = db;
  }

  public record Account(
      String id, String email, String name, String role, String status, String joined) {}

  public Account byEmail(String email) {
    return db
        .query(
            "SELECT * FROM app_users WHERE email=?",
            (r, n) ->
                new Account(
                    r.getString("id"),
                    r.getString("email"),
                    r.getString("name"),
                    r.getString("role"),
                    r.getString("status"),
                    PortalStore.timestamp(r, "joined")),
            email.toLowerCase(Locale.ROOT))
        .stream()
        .findFirst()
        .orElseThrow(ApiException::missing);
  }

  public Account byId(String id) {
    String email =
        db.query("SELECT email FROM app_users WHERE id=?", (r, n) -> r.getString(1), id).stream()
            .findFirst()
            .orElseThrow(ApiException::missing);
    return byEmail(email);
  }

  @Override
  public UserDetails loadUserByUsername(String email) {
    try {
      Account a = byEmail(email);
      String hash =
          db.queryForObject("SELECT password_hash FROM app_users WHERE id=?", String.class, a.id());
      return User.withUsername(a.email())
          .password(hash)
          .roles(a.role().toUpperCase(Locale.ROOT))
          .disabled(!a.status().equals("Active"))
          .build();
    } catch (ApiException ex) {
      throw new UsernameNotFoundException("Invalid credentials");
    }
  }
}
