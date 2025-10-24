// src/main/java/com/noithat/qlnt/backend/exception/GlobalExceptionHandler.java
package com.noithat.qlnt.backend.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.fasterxml.jackson.databind.JsonMappingException;

import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - Not Found
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFoundException(EntityNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 404);
        body.put("error", "Không tìm thấy");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 404);
        body.put("error", "Không tìm thấy");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }
    
    // 400 - Bad Request
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Dữ liệu không hợp lệ");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    // JSON Parse Error
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Lỗi cú pháp JSON");
        
        String message = "Dữ liệu JSON không hợp lệ";
        if (ex.getCause() instanceof JsonMappingException) {
            JsonMappingException jme = (JsonMappingException) ex.getCause();
            message = "Lỗi JSON: " + jme.getOriginalMessage();
        } else if (ex.getMessage() != null) {
            if (ex.getMessage().contains("Unexpected character")) {
                message = "JSON chứa ký tự không hợp lệ. Vui lòng kiểm tra lại định dạng JSON (đặc biệt là dấu ngoặc kép và dấu phẩy)";
            }
        }
        
        body.put("message", message);
        body.put("details", "Kiểm tra lại cú pháp JSON trong request body");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    // Validation Error
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        body.put("status", 400);
        body.put("error", "Lỗi validation");
        body.put("message", "Dữ liệu không hợp lệ");
        body.put("details", errors);
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    // Database Constraint Error
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 409);
        body.put("error", "Lỗi ràng buộc dữ liệu");
        
        String message = "Không thể thực hiện thao tác";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("FOREIGN KEY")) {
                message = "Không thể xóa vì dữ liệu này đang được sử dụng ở nơi khác";
            } else if (ex.getMessage().contains("UNIQUE")) {
                message = "Dữ liệu đã tồn tại trong hệ thống";
            }
        }
        
        body.put("message", message);
        body.put("details", "Kiểm tra các ràng buộc dữ liệu");
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }
    
    // Method Not Supported
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 405);
        body.put("error", "Phương thức không được hỗ trợ");
        body.put("message", "Method " + ex.getMethod() + " không được hỗ trợ cho endpoint này");
        body.put("details", "Các method được hỗ trợ: " + ex.getSupportedHttpMethods());
        return new ResponseEntity<>(body, HttpStatus.METHOD_NOT_ALLOWED);
    }
    
    // Type Mismatch
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Lỗi kiểu dữ liệu");
        body.put("message", "Tham số '" + ex.getName() + "' không đúng định dạng");
        body.put("details", "Giá trị '" + ex.getValue() + "' không hợp lệ");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    // Generic Exception
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 500);
        body.put("error", "Lỗi hệ thống");
        body.put("message", "Đã xảy ra lỗi không mong muốn");
        body.put("details", ex.getMessage());
        
        ex.printStackTrace();
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}