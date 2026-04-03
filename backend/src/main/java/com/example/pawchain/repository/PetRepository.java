package com.example.pawchain.repository;

import com.example.pawchain.model.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(String ownerAddress);

    List<Pet> findByOwnerAddressIgnoreCase(String ownerAddress);

    Optional<Pet> findByOwnerAddressIgnoreCaseAndImageHash(String ownerAddress, String imageHash);

    boolean existsByImageHash(String imageHash);

    @Query("SELECT p FROM Pet p ORDER BY p.likeCount DESC")
    List<Pet> findTopByLikes();

    @Query("SELECT p.nftValue FROM Pet p WHERE p.id = :id")
    Optional<Integer> findNftValueById(@Param("id") Long id);
}
