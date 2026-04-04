package com.example.pawchain.api.util;

import com.example.pawchain.api.exception.ApiException;
import org.springframework.http.HttpStatus;

public final class ValidationUtils {

    private ValidationUtils() {
    }

    public static void require(boolean condition, String message) {
        if (!condition) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
    }

    public static String requireRegistrationNo(String value) {
        String normalized = normalize(value);
        require(normalized.matches("\\d{15}"), "registrationNo는 15자리 숫자여야 합니다.");
        return normalized;
    }

    public static String requireWalletAddress(String value, String fieldName) {
        String normalized = normalize(value).toLowerCase();
        require(normalized.matches("0x[a-f0-9]{40}"), fieldName + "는 0x로 시작하는 42자리 지갑 주소여야 합니다.");
        return normalized;
    }

    public static String requireText(String value, String fieldName) {
        String normalized = normalize(value);
        require(!normalized.isBlank(), fieldName + " 값이 필요합니다.");
        return normalized;
    }

    public static Long requireId(Long value, String fieldName) {
        require(value != null && value > 0, fieldName + "는 1 이상의 값이어야 합니다.");
        return value;
    }

    public static String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
