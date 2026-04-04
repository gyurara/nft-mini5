package com.example.pawchain.api.repository;

import com.example.pawchain.api.entity.MedicalRecordEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecordEntity, Long> {

    List<MedicalRecordEntity> findByPetSbtIdOrderByCreatedAtAsc(Long petSbtId);
}
