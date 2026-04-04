package com.example.pawchain.controller;

import com.example.pawchain.model.Pet;
import com.example.pawchain.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pets")
@CrossOrigin(origins = "*")
public class PetController {

    @Autowired
    private PetRepository petRepository;

    // ✅ 전체 조회 (테스트용 + 405 방지)
    @GetMapping
    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    // ✅ 반려동물 등록
    @PostMapping
    public ResponseEntity<?> registerPet(@RequestBody Pet pet) {

        if (pet.getOwnerAddress() == null || pet.getOwnerAddress().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "지갑 주소가 필요합니다."));
        }
        if (pet.getName() == null || pet.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "반려동물 이름이 필요합니다."));
        }

        if (pet.getImageHash() != null && !pet.getImageHash().isBlank()) {
            Optional<Pet> duplicate = petRepository
                    .findByOwnerAddressIgnoreCaseAndImageHash(
                            pet.getOwnerAddress(), pet.getImageHash()
                    );

            if (duplicate.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "이미 같은 사진으로 등록된 반려동물이 있습니다.",
                        "duplicatePetId", duplicate.get().getId(),
                        "duplicatePetName", duplicate.get().getName()
                ));
            }
        }

        pet.setOwnerAddress(pet.getOwnerAddress().toLowerCase());
        pet.setLikeCount(0);
        pet.setNftValue(1000);

        Pet saved = petRepository.save(pet);
        return ResponseEntity.ok(saved);
    }

    // ✅ 주소로 조회 (명확하게 분리)
    @GetMapping("/owner/{address}")
    public List<Pet> getMyPets(@PathVariable String address) {
        return petRepository
                .findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(address);
    }

    // ✅ ID로 단건 조회 (추가)
    @GetMapping("/id/{id}")
    public ResponseEntity<?> getPetById(@PathVariable Long id) {
        return petRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ NFT 가치 조회
    @GetMapping("/id/{id}/value")
    public ResponseEntity<?> getNftValue(@PathVariable Long id) {
        return petRepository.findById(id)
                .map(p -> ResponseEntity.ok(Map.of(
                        "id", p.getId(),
                        "name", p.getName(),
                        "likeCount", p.getLikeCount(),
                        "nftValue", p.getNftValue()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ 이미지 중복 체크
    @GetMapping("/check-image")
    public ResponseEntity<?> checkImageDuplicate(
            @RequestParam String address,
            @RequestParam String hash) {

        Optional<Pet> dup =
                petRepository.findByOwnerAddressIgnoreCaseAndImageHash(address, hash);

        if (dup.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "isDuplicate", true,
                    "petName", dup.get().getName(),
                    "petId", dup.get().getId()
            ));
        }
        return ResponseEntity.ok(Map.of("isDuplicate", false));
    }

    // ✅ 인기 TOP10
    @GetMapping("/top")
    public List<Pet> getTopPets() {
        return petRepository.findTopByLikes()
                .stream()
                .limit(10)
                .toList();
    }
}