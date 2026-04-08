package com.example.pawchain.repository;

import com.example.pawchain.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT r FROM MedicalRecord r WHERE r.petSbtId = :petSbtId ORDER BY r.visitDate DESC")
    List<MedicalRecord> findByPetSbtIdOrderByVisitDateDesc(@Param("petSbtId") Long petSbtId);

    @Query("SELECT r FROM MedicalRecord r WHERE LOWER(r.ownerAddress) = LOWER(:addr) ORDER BY r.createdAt DESC")
    List<MedicalRecord> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(@Param("addr") String addr);
}
