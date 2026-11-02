import java.sql.DriverManager;

/** Bootstrap the local database when a portable PostgreSQL lacks psql/createdb. */
public class EnsureDevDatabase {
  public static void main(String[] args) throws Exception {
    try (var connection = DriverManager.getConnection(
        "jdbc:postgresql://127.0.0.1:55432/postgres", "algoventure", System.getenv("DB_PASSWORD"))) {
      try (var query = connection.prepareStatement("SELECT 1 FROM pg_database WHERE datname=?")) {
        query.setString(1, "algoventure");
        try (var result = query.executeQuery()) {
          if (!result.next()) {
            try (var create = connection.createStatement()) { create.execute("CREATE DATABASE algoventure"); }
          }
        }
      }
    }
    System.out.println("Local AlgoVenture database is ready.");
  }
}
