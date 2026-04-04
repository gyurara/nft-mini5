package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.CodefVerificationResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TokenMetadataService {

    private static final String PET_SBT_DESCRIPTION = "PetChain SBT - 반려동물 신원 인증 토큰";
    private final ObjectMapper objectMapper;

    public TokenMetadataService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> buildSbtMetadata(CodefVerificationResult result, String imageUri) {
        return Map.of(
            "name", result.animalName(),
            "description", PET_SBT_DESCRIPTION,
            "image", imageUri,
            "attributes", List.of(
                Map.of("trait_type", "registrationNo", "value", result.animalRegistNo()),
                Map.of("trait_type", "breed", "value", result.speciesName()),
                Map.of("trait_type", "gender", "value", result.animalGender()),
                Map.of("trait_type", "birthDate", "value", result.birthDate()),
                Map.of("trait_type", "neutered", "value", result.neutralYn())
            )
        );
    }

    public Map<String, Object> buildMemoryNftMetadata(Long petSbtId, String eventType, String imageUri) {
        return Map.of(
            "name", "PetChain Memory NFT #" + petSbtId,
            "description", "반려동물 추억 기록 NFT",
            "image", imageUri,
            "attributes", List.of(
                Map.of("trait_type", "petSbtId", "value", petSbtId),
                Map.of("trait_type", "eventType", "value", eventType)
            )
        );
    }

    public String toJson(Map<String, Object> metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("메타데이터 직렬화에 실패했습니다.", exception);
        }
    }
}
