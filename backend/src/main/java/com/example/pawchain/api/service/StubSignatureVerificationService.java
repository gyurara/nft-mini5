package com.example.pawchain.api.service;

import com.example.pawchain.api.exception.ApiException;
import com.example.pawchain.api.util.ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class StubSignatureVerificationService implements SignatureVerificationService {

    @Override
    public void verifyOwnerSignature(String ownerAddress, String ownerSignature, Long petSbtId) {
        String normalizedSignature = ValidationUtils.requireText(ownerSignature, "ownerSignature");
        String expectedToken = ownerAddress.substring(2, Math.min(ownerAddress.length(), 8));
        if (normalizedSignature.length() < 10 || !normalizedSignature.toLowerCase().contains(expectedToken)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ownerSignature 검증에 실패했습니다.");
        }
        if (petSbtId == null || petSbtId <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "petSbtId가 올바르지 않습니다.");
        }
    }
}
