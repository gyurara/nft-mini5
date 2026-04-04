package com.example.pawchain.api.repository;

import com.example.pawchain.api.entity.SbtTokenEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SbtTokenRepository extends JpaRepository<SbtTokenEntity, Long> {

    boolean existsByRegistrationNo(String registrationNo);

    List<SbtTokenEntity> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(String ownerAddress);

    Optional<SbtTokenEntity> findByTokenIdAndOwnerAddressIgnoreCase(Long tokenId, String ownerAddress);
}
