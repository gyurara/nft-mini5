package com.example.pawchain.api.dto;

import java.math.BigDecimal;

public record MemoryNftMintRequest(
    Long petSbtId,
    String eventType,
    String imageUri,
    String ownerAddress,
    BigDecimal mintFee
) {
}
