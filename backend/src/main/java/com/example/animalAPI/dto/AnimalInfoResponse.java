package com.example.animalAPI.dto;

public record AnimalInfoResponse(
    String dogRegNo,
    String rfidCd,
    String birthDt,
    String dogNm,
    String sexNm,
    String kindNm,
    String neuterYn
) {
}
