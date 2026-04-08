package com.example.pawchain.repository;

import com.example.pawchain.model.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {

    @Query("SELECT p FROM Pet p WHERE LOWER(p.ownerAddress) = LOWER(:addr) ORDER BY p.createdAt DESC")
    List<Pet> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(@Param("addr") String addr);

    @Query("SELECT p FROM Pet p WHERE LOWER(p.ownerAddress) = LOWER(:addr)")
    List<Pet> findByOwnerAddressIgnoreCase(@Param("addr") String addr);

    @Query("SELECT p FROM Pet p WHERE LOWER(p.ownerAddress) = LOWER(:addr) AND p.imageHash = :hash")
    Optional<Pet> findByOwnerAddressIgnoreCaseAndImageHash(@Param("addr") String addr, @Param("hash") String hash);

    @Query("SELECT p FROM Pet p ORDER BY p.likeCount DESC")
    List<Pet> findTopByLikes();

    @Query("SELECT p.nftValue FROM Pet p WHERE p.id = :id")
    Optional<Integer> findNftValueById(@Param("id") Long id);

    @Query("SELECT p FROM Pet p WHERE p.id = :id")
    Optional<Pet> findByIdQuery(@Param("id") Long id);
}
