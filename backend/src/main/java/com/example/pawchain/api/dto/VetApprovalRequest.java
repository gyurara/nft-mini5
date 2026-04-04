package com.example.pawchain.api.dto;

public record VetApprovalRequest(
    Long petSbtId,
    String vetAddress,
    String ownerSignature
) {
}
