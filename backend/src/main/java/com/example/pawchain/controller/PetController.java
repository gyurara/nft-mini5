package com.example.pawchain.controller;

import com.example.pawchain.model.Pet;
import com.example.pawchain.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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
        List<Pet> pets = petRepository.findAll();
        pets.forEach(p -> p.setImage(null));
        return pets;
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

        // birthDate 유효성 검사 (YYYY-MM-DD, 1900 이후, 미래 날짜 불가)
        if (pet.getBirthDate() != null && !pet.getBirthDate().isBlank()) {
            try {
                LocalDate date = LocalDate.parse(pet.getBirthDate());
                if (date.getYear() < 1900 || date.isAfter(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "유효하지 않은 생년월일입니다."));
                }
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "생년월일은 YYYY-MM-DD 형식이어야 합니다."));
            }
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

        // base64 이미지는 DB에 저장하지 않음 (S3 업로드 후 s3ImageUrl 사용)
        String imageForResponse = pet.getImage();
        pet.setImage(null);

        Pet saved = petRepository.save(pet);

        // 응답에는 이미지 포함 (프론트엔드 캐싱용)
        if (imageForResponse != null) {
            saved.setImage(imageForResponse);
        }
        return ResponseEntity.ok(saved);
    }

    // ✅ 주소로 조회 (명확하게 분리)
    @GetMapping("/owner/{address}")
    public List<Pet> getMyPets(@PathVariable("address") String address) {
        List<Pet> pets = petRepository.findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(address);
        pets.forEach(p -> p.setImage(null));
        return pets;
    }

    // ✅ ID로 단건 조회 (추가)
    @GetMapping("/id/{id}")
    public ResponseEntity<?> getPetById(@PathVariable("id") Long id) {
        return petRepository.findByIdQuery(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ NFT 가치 조회
    @GetMapping("/id/{id}/value")
    public ResponseEntity<?> getNftValue(@PathVariable("id") Long id) {
        return petRepository.findByIdQuery(id)
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

    // ✅ SBT/NFT 토큰 ID 동기화 (민팅 완료 후 호출)
    @PatchMapping("/id/{id}/tokens")
    public ResponseEntity<?> updateTokenIds(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return petRepository.findByIdQuery(id)
                .map(pet -> {
                    if (body.containsKey("sbtTokenId") && body.get("sbtTokenId") != null) {
                        pet.setSbtTokenId(Long.parseLong(body.get("sbtTokenId").toString()));
                    }
                    if (body.containsKey("tokenId") && body.get("tokenId") != null) {
                        pet.setTokenId(Long.parseLong(body.get("tokenId").toString()));
                    }
                    if (body.containsKey("txHash") && body.get("txHash") != null) {
                        pet.setTxHash(body.get("txHash").toString());
                    }
                    Pet updated = petRepository.save(pet);
                    updated.setImage(null); // base64 응답 제외
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
