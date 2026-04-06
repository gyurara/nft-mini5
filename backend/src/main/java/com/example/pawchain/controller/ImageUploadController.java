package com.example.pawchain.controller;

import com.example.pawchain.model.Pet;
import com.example.pawchain.repository.PetRepository;
import com.example.pawchain.service.S3UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 이미지 업로드 컨트롤러
 * - 반려동물 프로필 이미지, 진료기록 첨부 이미지, 추억 NFT 이미지 등을 S3에 업로드합니다.
 * - 업로드 후 반환된 S3 URL을 DB에 저장하거나 SBT/NFT 메타데이터에 활용합니다.
 */
@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageUploadController {

    private final S3UploadService s3UploadService;
    private final PetRepository petRepository;

    public ImageUploadController(S3UploadService s3UploadService, PetRepository petRepository) {
        this.s3UploadService = s3UploadService;
        this.petRepository = petRepository;
    }

    /**
     * 반려동물 프로필 이미지 업로드
     * 업로드 후 Pet.s3ImageUrl에 URL을 저장합니다.
     *
     * POST /api/images/pet/{petId}
     * Content-Type: multipart/form-data
     * Body: file (이미지 파일)
     */
    @PostMapping("/pet/{petId}")
    public ResponseEntity<?> uploadPetImage(
        @PathVariable Long petId,
        @RequestParam("file") MultipartFile file
    ) {
        try {
            Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found: " + petId));

            String s3Url = s3UploadService.uploadImage(file, "pets");

            pet.setS3ImageUrl(s3Url);
            petRepository.save(pet);

            return ResponseEntity.ok(Map.of(
                "petId", petId,
                "s3ImageUrl", s3Url,
                "message", "이미지 업로드 성공"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 진료기록 첨부 이미지 업로드
     * 이 URL을 MedicalRecordAddRequest.imageUrl에 담아서 /api/record/add 호출 시 함께 전달하세요.
     *
     * POST /api/images/medical
     */
    @PostMapping("/medical")
    public ResponseEntity<?> uploadMedicalImage(@RequestParam("file") MultipartFile file) {
        try {
            String s3Url = s3UploadService.uploadImage(file, "medical");
            return ResponseEntity.ok(Map.of(
                "s3ImageUrl", s3Url,
                "message", "진료 이미지 업로드 성공. 이 URL을 진료기록 등록 요청에 포함하세요."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 추억 NFT / SBT 민팅용 이미지 업로드
     * 이 URL을 SbtMintRequest.imageUri 또는 MemoryNftMintRequest에 담아 민팅 요청 시 사용하세요.
     *
     * POST /api/images/nft
     */
    @PostMapping("/nft")
    public ResponseEntity<?> uploadNftImage(@RequestParam("file") MultipartFile file) {
        try {
            String s3Url = s3UploadService.uploadImage(file, "nft");
            return ResponseEntity.ok(Map.of(
                "s3ImageUrl", s3Url,
                "message", "NFT 이미지 업로드 성공. 이 URL을 민팅 요청의 imageUri에 사용하세요."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
