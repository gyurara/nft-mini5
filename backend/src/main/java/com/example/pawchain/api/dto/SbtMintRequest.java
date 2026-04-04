package com.example.pawchain.api.dto;

public record SbtMintRequest(
    String registrationNo,
    String ownerAddress,
    String imageUri
) {
}
