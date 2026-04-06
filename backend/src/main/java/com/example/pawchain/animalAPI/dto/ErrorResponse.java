package com.example.pawchain.animalAPI.dto;

public record ErrorResponse(
    int status,
    String error,
    String message
) {
}
