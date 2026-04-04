package com.example.pawchain.api.repository;

import com.example.pawchain.api.entity.VetApprovalEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VetApprovalRepository extends JpaRepository<VetApprovalEntity, Long> {

    Optional<VetApprovalEntity> findTopByPetSbtIdAndVetAddressIgnoreCaseOrderByUpdatedAtDesc(Long petSbtId, String vetAddress);

    List<VetApprovalEntity> findByPetSbtIdAndActiveTrue(Long petSbtId);
}
