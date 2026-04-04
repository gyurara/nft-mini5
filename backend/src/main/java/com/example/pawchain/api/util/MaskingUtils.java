package com.example.pawchain.api.util;

public final class MaskingUtils {

    private MaskingUtils() {
    }

    public static String maskRegistrationNo(String registrationNo) {
        if (registrationNo == null || registrationNo.length() < 7) {
            return "***";
        }
        return registrationNo.substring(0, 3) + "*********" + registrationNo.substring(registrationNo.length() - 3);
    }

    public static String maskOwnerId(String ownerId) {
        if (ownerId == null || ownerId.length() < 3) {
            return "***";
        }
        return ownerId.substring(0, 1) + "***" + ownerId.substring(ownerId.length() - 1);
    }
}
