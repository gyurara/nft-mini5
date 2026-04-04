package com.example.pawchain.api.service;

import com.example.pawchain.api.dto.MedicalRecordAddRequest;
import com.example.pawchain.api.dto.MedicalRecordAddResponse;
import com.example.pawchain.api.dto.MedicalRecordResponse;
import com.example.pawchain.api.entity.MedicalRecordEntity;
import com.example.pawchain.api.repository.MedicalRecordRepository;
import com.example.pawchain.api.util.ValidationUtils;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final SbtService sbtService;
    private final HashingService hashingService;

    public MedicalRecordService(
        MedicalRecordRepository medicalRecordRepository,
        SbtService sbtService,
        HashingService hashingService
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.sbtService = sbtService;
        this.hashingService = hashingService;
    }

    @Transactional
    public MedicalRecordAddResponse addRecord(MedicalRecordAddRequest request) {
        Long petSbtId = ValidationUtils.requireId(request.petSbtId(), "petSbtId");
        String type = ValidationUtils.requireText(request.type(), "type");
        String description = ValidationUtils.requireText(request.description(), "description");
        String vetAddress = ValidationUtils.requireWalletAddress(request.vetAddress(), "vetAddress");

        sbtService.assertApprovedVet(petSbtId, vetAddress);

        String ipfsHash = hashingService.sha256(petSbtId + ":" + type + ":" + description + ":" + vetAddress);
        String txHash = sbtService.createTransactionResult(petSbtId).txHash();

        MedicalRecordEntity entity = new MedicalRecordEntity();
        entity.setPetSbtId(petSbtId);
        entity.setRecordType(type);
        entity.setDescription(description);
        entity.setVetAddress(vetAddress);
        entity.setIpfsHash(ipfsHash);
        entity.setTxHash(txHash);

        MedicalRecordEntity saved = medicalRecordRepository.save(entity);
        return new MedicalRecordAddResponse(saved.getTxHash(), saved.getIpfsHash(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getRecords(Long petSbtId) {
        ValidationUtils.requireId(petSbtId, "petSbtId");
        return medicalRecordRepository.findByPetSbtIdOrderByCreatedAtAsc(petSbtId)
            .stream()
            .map(record -> new MedicalRecordResponse(
                record.getRecordType(),
                record.getDescription(),
                record.getIpfsHash(),
                record.getCreatedAt()
            ))
            .toList();
    }
}
