package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.MemoryNftMintRequest;
import com.example.pawchain.api.dto.MemoryNftMintResponse;
import com.example.pawchain.api.entity.MemoryNftEntity;
import com.example.pawchain.api.entity.SbtTokenEntity;
import com.example.pawchain.api.exception.ApiException;
import com.example.pawchain.api.repository.MemoryNftRepository;
import com.example.pawchain.api.util.ValidationUtils;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemoryNftService {

    private final MemoryNftRepository memoryNftRepository;
    private final SbtService sbtService;
    private final TokenMetadataService tokenMetadataService;

    public MemoryNftService(
        MemoryNftRepository memoryNftRepository,
        SbtService sbtService,
        TokenMetadataService tokenMetadataService
    ) {
        this.memoryNftRepository = memoryNftRepository;
        this.sbtService = sbtService;
        this.tokenMetadataService = tokenMetadataService;
    }

    @Transactional
    public MemoryNftMintResponse mint(MemoryNftMintRequest request) {
        Long petSbtId = ValidationUtils.requireId(request.petSbtId(), "petSbtId");
        String eventType = ValidationUtils.requireText(request.eventType(), "eventType");
        String imageUri = ValidationUtils.requireText(request.imageUri(), "imageUri");
        String ownerAddress = ValidationUtils.requireWalletAddress(request.ownerAddress(), "ownerAddress");
        BigDecimal mintFee = request.mintFee();

        if (mintFee == null || mintFee.signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "mintFee는 0 이상이어야 합니다.");
        }

        SbtTokenEntity token = sbtService.requireOwnedToken(petSbtId, ownerAddress);
        Map<String, Object> metadata = tokenMetadataService.buildMemoryNftMetadata(token.getTokenId(), eventType, imageUri);
        String tokenUri = "data:application/json," + tokenMetadataService.toJson(metadata);

        MemoryNftEntity entity = new MemoryNftEntity();
        entity.setPetSbtId(token.getTokenId());
        entity.setEventType(eventType);
        entity.setImageUri(imageUri);
        entity.setOwnerAddress(ownerAddress);
        entity.setMintFee(mintFee);
        entity.setTokenUri(tokenUri);
        entity.setTxHash(sbtService.createTransactionResult(token.getTokenId()).txHash());

        MemoryNftEntity saved = memoryNftRepository.save(entity);
        return new MemoryNftMintResponse(saved.getTokenId(), saved.getTxHash(), saved.getTokenUri());
    }
}
