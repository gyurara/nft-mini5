package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.BlockchainTxResult;
import com.example.pawchain.api.dto.CodefVerificationResult;
import com.example.pawchain.api.dto.HasSbtResponse;
import com.example.pawchain.api.dto.SbtMintRequest;
import com.example.pawchain.api.dto.SbtMintResponse;
import com.example.pawchain.api.dto.VetApprovalRequest;
import com.example.pawchain.api.dto.VetApprovalResponse;
import com.example.pawchain.api.dto.VetRevocationResponse;
import com.example.pawchain.api.entity.SbtTokenEntity;
import com.example.pawchain.api.entity.VetApprovalEntity;
import com.example.pawchain.api.exception.ApiException;
import com.example.pawchain.api.repository.SbtTokenRepository;
import com.example.pawchain.api.repository.VetApprovalRepository;
import com.example.pawchain.api.util.ValidationUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SbtService {

    private static final Logger log = LoggerFactory.getLogger(SbtService.class);

    private final SbtTokenRepository sbtTokenRepository;
    private final VetApprovalRepository vetApprovalRepository;
    private final CodefAnimalVerificationService codefAnimalVerificationService;
    private final SignatureVerificationService signatureVerificationService;
    private final TokenMetadataService tokenMetadataService;

    public SbtService(
        SbtTokenRepository sbtTokenRepository,
        VetApprovalRepository vetApprovalRepository,
        CodefAnimalVerificationService codefAnimalVerificationService,
        SignatureVerificationService signatureVerificationService,
        TokenMetadataService tokenMetadataService
    ) {
        this.sbtTokenRepository = sbtTokenRepository;
        this.vetApprovalRepository = vetApprovalRepository;
        this.codefAnimalVerificationService = codefAnimalVerificationService;
        this.signatureVerificationService = signatureVerificationService;
        this.tokenMetadataService = tokenMetadataService;
    }

    @Transactional
    public SbtMintResponse mint(SbtMintRequest request) {
        String registrationNo = ValidationUtils.requireRegistrationNo(request.registrationNo());
        String ownerAddress = ValidationUtils.requireWalletAddress(request.ownerAddress(), "ownerAddress");
        String imageUri = ValidationUtils.requireText(request.imageUri(), "imageUri");

        if (sbtTokenRepository.existsByRegistrationNo(registrationNo)) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 발급된 동물등록번호입니다.");
        }

        CodefVerificationResult verificationResult = codefAnimalVerificationService.verify(registrationNo);
        if (!verificationResult.isSuccess()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "동물등록번호 검증에 실패했습니다.");
        }

        Map<String, Object> metadata = tokenMetadataService.buildSbtMetadata(verificationResult, imageUri);
        String metadataJson = tokenMetadataService.toJson(metadata);
        String tokenUri = "data:application/json," + metadataJson;

        SbtTokenEntity entity = new SbtTokenEntity();
        entity.setOwnerAddress(ownerAddress);
        entity.setRegistrationNo(registrationNo);
        entity.setTokenUri(tokenUri);
        entity.setMetadataJson(metadataJson);
        entity.setTxHash(generateTxHash());

        SbtTokenEntity saved = sbtTokenRepository.save(entity);
        log.info("SBT minted tokenId={}, ownerAddress={}", saved.getTokenId(), ownerAddress);
        return new SbtMintResponse(saved.getTokenId(), saved.getTxHash(), saved.getTokenUri(), metadata);
    }

    @Transactional
    public VetApprovalResponse approveVet(VetApprovalRequest request) {
        VetApprovalEntity approval = upsertVetApproval(request, true);
        return new VetApprovalResponse(approval.getTxHash(), approval.getVetAddress(), approval.getUpdatedAt());
    }

    @Transactional
    public VetRevocationResponse revokeVet(VetApprovalRequest request) {
        VetApprovalEntity approval = upsertVetApproval(request, false);
        return new VetRevocationResponse(approval.getTxHash(), approval.getVetAddress(), approval.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public HasSbtResponse hasSbt(String ownerAddress) {
        String normalizedOwnerAddress = ValidationUtils.requireWalletAddress(ownerAddress, "ownerAddress");
        List<Long> tokenIds = sbtTokenRepository.findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(normalizedOwnerAddress)
            .stream()
            .map(SbtTokenEntity::getTokenId)
            .toList();
        return new HasSbtResponse(!tokenIds.isEmpty(), tokenIds);
    }

    @Transactional(readOnly = true)
    public SbtTokenEntity requireOwnedToken(Long petSbtId, String ownerAddress) {
        ValidationUtils.requireId(petSbtId, "petSbtId");
        String normalizedOwnerAddress = ValidationUtils.requireWalletAddress(ownerAddress, "ownerAddress");
        return sbtTokenRepository.findByTokenIdAndOwnerAddressIgnoreCase(petSbtId, normalizedOwnerAddress)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 보호자의 SBT를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public void assertApprovedVet(Long petSbtId, String vetAddress) {
        String normalizedVetAddress = ValidationUtils.requireWalletAddress(vetAddress, "vetAddress");
        boolean approved = vetApprovalRepository
            .findTopByPetSbtIdAndVetAddressIgnoreCaseOrderByUpdatedAtDesc(petSbtId, normalizedVetAddress)
            .map(VetApprovalEntity::isActive)
            .orElse(false);

        if (!approved) {
            throw new ApiException(HttpStatus.FORBIDDEN, "승인된 병원만 접근할 수 있습니다.");
        }
    }

    private VetApprovalEntity upsertVetApproval(VetApprovalRequest request, boolean active) {
        Long petSbtId = ValidationUtils.requireId(request.petSbtId(), "petSbtId");
        String vetAddress = ValidationUtils.requireWalletAddress(request.vetAddress(), "vetAddress");

        SbtTokenEntity token = sbtTokenRepository.findById(petSbtId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SBT를 찾을 수 없습니다."));

        signatureVerificationService.verifyOwnerSignature(token.getOwnerAddress(), request.ownerSignature(), petSbtId);

        VetApprovalEntity approval = vetApprovalRepository
            .findTopByPetSbtIdAndVetAddressIgnoreCaseOrderByUpdatedAtDesc(petSbtId, vetAddress)
            .orElseGet(VetApprovalEntity::new);

        approval.setPetSbtId(petSbtId);
        approval.setOwnerAddress(token.getOwnerAddress());
        approval.setVetAddress(vetAddress);
        approval.setOwnerSignature(request.ownerSignature().trim());
        approval.setActive(active);
        approval.setTxHash(generateTxHash());

        VetApprovalEntity saved = vetApprovalRepository.save(approval);
        log.info("Vet approval updated petSbtId={}, vetAddress={}, active={}", petSbtId, vetAddress, active);
        return saved;
    }

    public BlockchainTxResult createTransactionResult(Long tokenId) {
        return new BlockchainTxResult(tokenId, generateTxHash(), LocalDateTime.now());
    }

    private String generateTxHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "") + "00";
    }
}
