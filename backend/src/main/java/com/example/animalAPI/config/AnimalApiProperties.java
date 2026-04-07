package com.example.animalAPI.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AnimalApiProperties {
    private final String serviceKey;
    private final String baseUrl;

    public AnimalApiProperties(
        @Value("${animal.api.service-key:}") String configuredServiceKey,
        @Value("${animal.api.base-url:https://apis.data.go.kr/1543061/animalInfoSrvc/animalInfo}") String baseUrl
    ) {
        String envServiceKey = System.getenv("serviceKey");
        this.serviceKey = hasText(configuredServiceKey) ? configuredServiceKey.trim() : safeTrim(envServiceKey);
        this.baseUrl = baseUrl;
    }

    @PostConstruct
    void validate() {
        if (!hasText(serviceKey)) {
            throw new IllegalStateException("서비스 환경 설정 오류입니다. .env 또는 환경변수의 serviceKey 값을 설정하세요.");
        }
    }

    public String getServiceKey() {
        return serviceKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String safeTrim(String value) {
        return value == null ? null : value.trim();
    }
}
