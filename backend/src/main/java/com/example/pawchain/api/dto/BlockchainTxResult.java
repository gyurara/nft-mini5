package com.example.pawchain.api.dto;

import java.time.LocalDateTime;

public record BlockchainTxResult(
    Long tokenId,
    String txHash,
    LocalDateTime timestamp
) {
}
