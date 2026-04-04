package com.example.pawchain.api.exception;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.example.pawchain.api")
public class GlobalApiExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
            .body(errorBody(exception.getStatus(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "내부 서버 오류가 발생했습니다."));
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        return Map.of(
            "timestamp", LocalDateTime.now(),
            "status", status.value(),
            "error", message
        );
    }
}
