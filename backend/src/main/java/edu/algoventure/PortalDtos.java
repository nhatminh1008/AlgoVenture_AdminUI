package edu.algoventure;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public class PortalDtos {
  public record Classroom(
      @NotBlank @Size(max = 100) String name,
      @NotNull @Size(max = 500) String description,
      @NotBlank String topicId,
      @Pattern(regexp = "basic|advanced") @NotNull String level) {}

  public record Assignment(
      @NotBlank String classId,
      @NotBlank @Size(max = 100) String title,
      @NotNull @Size(max = 1000) String description,
      @Pattern(regexp = "Draft|Active|Closed") @NotNull String status,
      LocalDate due,
      @NotEmpty @Size(max = 25) List<@NotBlank String> lessonIds) {}

  public record Option(
      @NotBlank @Size(max = 100) String id, @NotNull @Size(max = 500) String text) {}

  public record Question(
      @NotBlank @Size(max = 100) String id,
      @NotNull @Size(max = 2000) String prompt,
      @NotNull @Size(min = 2, max = 6) List<@NotNull @Valid Option> options,
      @NotNull @Size(max = 100) String correctOptionId,
      @NotNull @Size(max = 2000) String explanation,
      @Min(1) @Max(20) int points) {}

  public record Quiz(
      @NotBlank String classId,
      @NotBlank @Size(max = 100) String title,
      @NotNull @Size(max = 1000) String description,
      @NotNull @Pattern(regexp = "Draft|Published") String status,
      LocalDate due,
      @NotNull @Size(max = 50) List<@NotNull @Valid Question> questions,
      @NotNull @Size(max = 100) List<@NotBlank String> materialIds) {}

  public record CreateUser(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(max = 100) String name,
      @NotNull @Pattern(regexp = "admin|instructor|learner") String role,
      @NotNull @Pattern(regexp = "Active|Pending|Suspended") String status,
      @NotBlank @Size(min = 10, max = 72) String password) {}

  // Admin User Management DTOs
  public record UpdateUser(
      @NotBlank @Size(max = 100) String name,
      @NotNull @Pattern(regexp = "admin|instructor|learner") String role,
      @NotNull @Pattern(regexp = "Active|Pending|Suspended") String status) {}

  public record UpdateUserRole(@NotNull @Pattern(regexp = "admin|instructor|learner") String role) {}

  public record UpdateUserStatus(@NotNull Boolean active) {}

  public record PaginatedResponse<T>(
      List<T> data, long total, int page, int size, int totalPages) {}

  // Forgot/Reset Password DTOs
  public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 254) String email) {}

  public record ResetPasswordRequest(
      @NotBlank @Size(min = 36, max = 36) String token,
      @NotBlank @Size(min = 10, max = 72) String password) {}

  // Admin Instructor Management DTOs
  public record CreateInstructor(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(max = 100) String name,
      @NotBlank @Size(min = 10, max = 72) String password) {}

  public record UpdateInstructorInfo(@NotBlank @Size(max = 100) String name) {}
}
