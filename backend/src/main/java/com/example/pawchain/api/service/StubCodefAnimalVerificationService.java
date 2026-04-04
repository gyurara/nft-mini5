package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.CodefVerificationResult;
import com.example.pawchain.api.exception.ApiException;
import com.example.pawchain.api.util.MaskingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class StubCodefAnimalVerificationService implements CodefAnimalVerificationService {

    private static final Logger log = LoggerFactory.getLogger(StubCodefAnimalVerificationService.class);

    @Override
    public CodefVerificationResult verify(String registrationNo) {
        log.info("CODEF verify request registrationNo={}", MaskingUtils.maskRegistrationNo(registrationNo));

        if (registrationNo.endsWith("000")) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "CODEF 검증에 실패했습니다.");
        }

        CodefVerificationResult result = new CodefVerificationResult(
            "Pet-" + registrationNo.substring(registrationNo.length() - 4),
            "MIXED",
            Integer.parseInt(registrationNo.substring(registrationNo.length() - 1)) % 2 == 0 ? "F" : "M",
            "20220101",
            "Y",
            registrationNo,
            "owner-" + registrationNo.substring(0, 4),
            "0000",
            "성공"
        );

        log.info(
            "CODEF verify response resultCode={}, ownerId={}",
            result.resultCode(),
            MaskingUtils.maskOwnerId(result.ownerId())
        );
        return result;
    }
}
