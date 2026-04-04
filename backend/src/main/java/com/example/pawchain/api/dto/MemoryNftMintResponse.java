package com.example.pawchain.api.dto;

public record MemoryNftMintResponse(
    Long tokenId,
    String txHash,
    String tokenURI
) {
}
