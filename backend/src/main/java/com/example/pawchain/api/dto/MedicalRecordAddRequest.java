package com.example.pawchain.api.dto;

public record MedicalRecordAddRequest(
    Long petSbtId,
    String type,
    String description,
    String vetAddress
) {
}
