package com.example.pawchain.api.service;

public interface SignatureVerificationService {

    void verifyOwnerSignature(String ownerAddress, String ownerSignature, Long petSbtId);
}
