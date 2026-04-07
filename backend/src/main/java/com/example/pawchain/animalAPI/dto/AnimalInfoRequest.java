package com.example.pawchain.animalAPI.dto;

public record AnimalInfoRequest(
    String dogRegNo,
    String rfidCd,
    String ownerNm,
    String ownerBirth
) {
}
