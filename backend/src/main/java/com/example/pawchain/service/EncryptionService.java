package com.example.pawchain.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.nio.charset.StandardCharsets;

/**
 * AES-256-CBC 암호화/복호화 서비스
 * Node.js 서버와 동일한 포맷 사용: "hex_iv:base64_encrypted"
 */
@Service
public class EncryptionService {

    private final SecretKeySpec secretKey;

    public EncryptionService(@Value("${aes.secret-key}") String key) {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        // 정확히 32바이트로 맞춤 (부족하면 0으로 패딩, 초과하면 잘라냄)
        this.secretKey = new SecretKeySpec(Arrays.copyOf(keyBytes, 32), "AES");
    }

    /**
     * 평문 → AES-256-CBC 암호화
     * 반환 형식: "hex_iv:base64_encrypted"
     */
    public String encrypt(String plainText) {
        if (plainText == null) return null;
        try {
            byte[] iv = new byte[16];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            String ivHex = HexFormat.of().formatHex(iv);
            String encryptedBase64 = Base64.getEncoder().encodeToString(encrypted);
            return ivHex + ":" + encryptedBase64;
        } catch (Exception e) {
            throw new RuntimeException("암호화 실패: " + e.getMessage(), e);
        }
    }

    /**
     * AES-256-CBC 복호화
     * 입력 형식: "hex_iv:base64_encrypted"
     * 형식이 맞지 않으면 원본 반환 (기존 평문 데이터 호환)
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null) return null;
        try {
            String[] parts = encryptedText.split(":", 2);
            if (parts.length != 2) return encryptedText;

            byte[] iv = HexFormat.of().parseHex(parts[0]);
            byte[] encrypted = Base64.getDecoder().decode(parts[1]);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // 복호화 실패 시 원본 반환 (평문 데이터 하위 호환)
            return encryptedText;
        }
    }
}
