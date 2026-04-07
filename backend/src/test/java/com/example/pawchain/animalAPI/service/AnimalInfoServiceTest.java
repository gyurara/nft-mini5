package com.example.pawchain.animalAPI.service;

import com.example.animalAPI.config.AnimalApiProperties;
import com.example.animalAPI.dto.AnimalInfoRequest;
import com.example.animalAPI.dto.AnimalInfoResponse;
import com.example.animalAPI.exception.AnimalApiException;
import com.example.animalAPI.service.AnimalInfoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.SocketTimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnimalInfoServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private AnimalApiProperties animalApiProperties;

    private AnimalInfoService animalInfoService;

    @BeforeEach
    void setUp() {
        lenient().when(animalApiProperties.getBaseUrl()).thenReturn("https://example.com/animal");
        lenient().when(animalApiProperties.getServiceKey()).thenReturn("test-key");
        animalInfoService = new AnimalInfoService(restTemplate, animalApiProperties);
    }

    @Test
    void extractsAndReturnsRequiredFields() throws Exception {
        String payload = """
            {
              "response": {
                "header": {
                  "resultCode": "00",
                  "resultMsg": "NORMAL SERVICE."
                },
                "body": {
                  "item": {
                    "dogRegNo": "410123456789012",
                    "rfidCd": "999999999999999",
                    "birthDt": "20200101",
                    "dogNm": "초코",
                    "sexNm": "암",
                    "kindNm": "말티즈",
                    "neuterYn": "Y",
                    "ignored": "value"
                  }
                }
              }
            }
            """;
        when(restTemplate.getForObject(any(URI.class), eq(com.fasterxml.jackson.databind.JsonNode.class)))
            .thenReturn(objectMapper.readTree(payload));

        AnimalInfoResponse response = animalInfoService.getAnimalInfo(
            new AnimalInfoRequest("410123456789012", "999999999999999", "홍길동", "900520")
        );

        assertEquals("410123456789012", response.dogRegNo());
        assertEquals("999999999999999", response.rfidCd());
        assertEquals("초코", response.dogNm());
        assertEquals("Y", response.neuterYn());
    }

    @Test
    void rejectsInvalidOwnerBirthFormat() {
        AnimalApiException exception = assertThrows(AnimalApiException.class, () -> animalInfoService.getAnimalInfo(
            new AnimalInfoRequest("410123456789012", "999999999999999", "홍길동", "90052A")
        ));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("owner_birth는 6자리 숫자(주민번호 앞자리)여야 합니다.", exception.getMessage());
    }

    @Test
    void returnsNotFoundWhenItemIsMissing() throws Exception {
        String payload = """
            {
              "response": {
                "header": {
                  "resultCode": "00",
                  "resultMsg": "NORMAL SERVICE."
                },
                "body": {}
              }
            }
            """;
        when(restTemplate.getForObject(any(URI.class), eq(com.fasterxml.jackson.databind.JsonNode.class)))
            .thenReturn(objectMapper.readTree(payload));

        AnimalApiException exception = assertThrows(AnimalApiException.class, () -> animalInfoService.getAnimalInfo(
            new AnimalInfoRequest("410123456789012", "999999999999999", "홍길동", "900520")
        ));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("등록된 동물 정보를 찾을 수 없습니다.", exception.getMessage());
    }

    @Test
    void mapsTimeoutToBadGateway() {
        when(restTemplate.getForObject(any(URI.class), eq(com.fasterxml.jackson.databind.JsonNode.class)))
            .thenThrow(new ResourceAccessException("timeout", new SocketTimeoutException("Read timed out")));

        AnimalApiException exception = assertThrows(AnimalApiException.class, () -> animalInfoService.getAnimalInfo(
            new AnimalInfoRequest("410123456789012", "999999999999999", "홍길동", "900520")
        ));

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
        assertEquals("외부 API 호출 중 오류가 발생했습니다.", exception.getMessage());
    }
}
