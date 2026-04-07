package com.example.animalAPI.service;

import com.example.animalAPI.config.AnimalApiProperties;
import com.example.animalAPI.dto.AnimalInfoRequest;
import com.example.animalAPI.dto.AnimalInfoResponse;
import com.example.animalAPI.exception.AnimalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class AnimalInfoService {
    private static final String OWNER_BIRTH_PATTERN = "^\\d{6}$";

    private final RestTemplate restTemplate;
    private final AnimalApiProperties properties;

    public AnimalInfoService(RestTemplate animalApiRestTemplate, AnimalApiProperties properties) {
        this.restTemplate = animalApiRestTemplate;
        this.properties = properties;
    }

    public AnimalInfoResponse getAnimalInfo(AnimalInfoRequest request) {
        validate(request);

        URI uri = UriComponentsBuilder
            .fromHttpUrl(properties.getBaseUrl())
            .queryParam("serviceKey", properties.getServiceKey())
            .queryParam("dog_reg_no", request.dogRegNo())
            .queryParam("rfid_cd", request.rfidCd())
            .queryParam("owner_nm", request.ownerNm())
            .queryParam("owner_birth", request.ownerBirth())
            .queryParam("_type", "json")
            .build()
            .encode()
            .toUri();

        try {
            JsonNode root = restTemplate.getForObject(uri, JsonNode.class);
            JsonNode item = extractItem(root);
            return new AnimalInfoResponse(
                text(item, "dogRegNo"),
                text(item, "rfidCd"),
                text(item, "birthDt"),
                text(item, "dogNm"),
                text(item, "sexNm"),
                text(item, "kindNm"),
                text(item, "neuterYn")
            );
        } catch (AnimalApiException exception) {
            throw exception;
        } catch (ResourceAccessException exception) {
            throw new AnimalApiException(HttpStatus.BAD_GATEWAY, "외부 API 호출 중 오류가 발생했습니다.");
        } catch (RestClientException exception) {
            throw new AnimalApiException(HttpStatus.BAD_GATEWAY, "외부 API 호출 중 오류가 발생했습니다.");
        }
    }

    private void validate(AnimalInfoRequest request) {
        validateRequired(request.dogRegNo(), "dog_reg_no");
        validateRequired(request.rfidCd(), "rfid_cd");
        validateRequired(request.ownerNm(), "owner_nm");
        validateRequired(request.ownerBirth(), "owner_birth");

        if (!request.ownerBirth().matches(OWNER_BIRTH_PATTERN)) {
            throw new AnimalApiException(HttpStatus.BAD_REQUEST, "owner_birth는 6자리 숫자(주민번호 앞자리)여야 합니다.");
        }
    }

    private void validateRequired(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new AnimalApiException(HttpStatus.BAD_REQUEST, fieldName + " 파라미터는 필수입니다.");
        }
    }

    private JsonNode extractItem(JsonNode root) {
        if (root == null || root.isNull()) {
            throw new AnimalApiException(HttpStatus.NOT_FOUND, "등록된 동물 정보를 찾을 수 없습니다.");
        }

        JsonNode header = root.path("response").path("header");
        String resultCode = text(header, "resultCode");
        JsonNode item = root.path("response").path("body").path("item");

        if (!item.isMissingNode() && !item.isNull() && !item.isEmpty()) {
            return item;
        }

        if ("00".equals(resultCode)) {
            throw new AnimalApiException(HttpStatus.NOT_FOUND, "등록된 동물 정보를 찾을 수 없습니다.");
        }

        throw new AnimalApiException(HttpStatus.BAD_GATEWAY, "외부 API 호출 중 오류가 발생했습니다.");
    }

    private String text(JsonNode node, String fieldName) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText(null);
    }
}
