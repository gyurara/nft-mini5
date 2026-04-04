package com.example.pawchain.api.dto;

import java.util.Map;

public record SbtMintResponse(
    Long tokenId,
    String txHash,
    String tokenURI,
    Map<String, Object> metadata
) {
}
