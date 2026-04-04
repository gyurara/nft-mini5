package com.example.pawchain.api.dto;

import java.time.LocalDateTime;

public record VetApprovalResponse(
    String txHash,
    String approvedVet,
    LocalDateTime timestamp
) {
}
