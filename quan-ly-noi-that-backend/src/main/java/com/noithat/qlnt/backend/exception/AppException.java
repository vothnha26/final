package com.noithat.qlnt.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Simple application exception carrying an HTTP status and message.
 */
public class AppException extends RuntimeException {
    private final int status;

    public AppException(int status, String message) {
        super(message);
        this.status = status;
    }

    public AppException(int status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    public HttpStatus toHttpStatus() {
        try {
            return HttpStatus.valueOf(status);
        } catch (Exception ex) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}
