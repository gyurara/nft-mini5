package com.example.pawchain.api.dto;

public record CodefVerificationResult(
    String animalName,
    String speciesName,
    String animalGender,
    String birthDate,
    String neutralYn,
    String animalRegistNo,
    String ownerId,
    String resultCode,
    String resultMessage
) {
    public boolean isSuccess() {
        return "0000".equals(resultCode);
    }
}
