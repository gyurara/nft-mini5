package com.example.pawchain.api.dto;

import java.time.LocalDateTime;

public record MedicalRecordResponse(
    String type,
    String description,
    String ipfsHash,
    LocalDateTime timestamp
) {
}
