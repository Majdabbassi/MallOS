package com.mmea.mallos.mall.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MallNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleMallNotFound(MallNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(FloorNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleFloorNotFound(FloorNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(PolygonNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePolygonNotFound(PolygonNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(StoreNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleStoreNotFound(StoreNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MallAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(MallAccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthException(org.springframework.security.core.AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleSpringAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(org.springframework.security.core.userdetails.UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    @ExceptionHandler(InvalidMallOperationException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOp(InvalidMallOperationException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(UserAlreadyMemberException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyMember(UserAlreadyMemberException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DuplicateStoreCodeException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateStoreCode(DuplicateStoreCodeException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return error(HttpStatus.CONFLICT, "A record with the same unique key already exists");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, "Malformed request body");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception caught by GlobalExceptionHandler", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
