package com.example.pawchain.repository;

import com.example.pawchain.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPetSbtIdOrderByVisitDateDesc(Long petSbtId);

    List<MedicalRecord> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(String ownerAddress);
}
