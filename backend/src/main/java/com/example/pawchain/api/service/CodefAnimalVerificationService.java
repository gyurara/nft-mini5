package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.CodefVerificationResult;

public interface CodefAnimalVerificationService {

    CodefVerificationResult verify(String registrationNo);
}
