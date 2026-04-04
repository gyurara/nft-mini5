package com.example.pawchain.api.dto;

import java.time.LocalDateTime;

public record MedicalRecordAddResponse(
    String txHash,
    String ipfsHash,
    LocalDateTime timestamp
) {
}
