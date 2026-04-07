package com.example.animalAPI.dto;

public record ErrorResponse(
    int status,
    String error,
    String message
) {
}
