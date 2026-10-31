package edu.algoventure;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

public class ApiException extends RuntimeException {
  public final HttpStatus status;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
  }

  public static ApiException bad(String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, message);
  }

  public static ApiException missing() {
    return new ApiException(
        HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu trong phạm vi tài khoản của bạn.");
  }
}

@RestControllerAdvice
class ApiErrors {
  @ExceptionHandler(ApiException.class)
  org.springframework.http.ResponseEntity<?> api(ApiException ex) {
    return org.springframework.http.ResponseEntity.status(ex.status)
        .body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  Map<String, String> validation(MethodArgumentNotValidException ex) {
    return Map.of(
        "message",
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .findFirst()
            .orElse("Dữ liệu không hợp lệ."));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  Map<String, String> conflict() {
    return Map.of("message", "Dữ liệu bị trùng hoặc vẫn đang được sử dụng.");
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
  Map<String, String> size() {
    return Map.of("message", "Mỗi tài liệu tối đa 10 MB.");
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  Map<String, String> malformed() {
    return Map.of("message", "Dữ liệu yêu cầu không hợp lệ.");
  }
}
