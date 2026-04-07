package com.example.animalAPI.exception;

import org.springframework.http.HttpStatus;

public class AnimalApiException extends RuntimeException {
    private final HttpStatus status;

    public AnimalApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
