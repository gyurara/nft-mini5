package com.example.pawchain.api.dto;

import java.time.LocalDateTime;

public record VetRevocationResponse(
    String txHash,
    String revokedVet,
    LocalDateTime timestamp
) {
}
