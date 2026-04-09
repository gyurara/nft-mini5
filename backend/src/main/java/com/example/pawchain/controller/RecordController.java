package com.example.pawchain.controller;

import com.example.pawchain.model.MedicalRecord;
import com.example.pawchain.repository.MedicalRecordRepository;
import com.example.pawchain.service.EncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 진료기록 API - feVite의 animalApi.addMedicalRecord / getMedicalRecords 와 연동
 * POST /api/record/add      - 진료기록 추가 (진단명, 치료, 메모를 AES-256 암호화 저장)
 * GET  /api/record/{petSbtId} - 반려동물 SBT ID 기준 진료기록 조회 (복호화 후 반환)
 */
@RestController
@RequestMapping("/api/record")
@CrossOrigin(origins = "*")
public class RecordController {

    @Autowired
    private MedicalRecordRepository recordRepository;

    @Autowired
    private EncryptionService encryptionService;

    /**
     * 진료기록 추가
     * Body: { petSbtId, ownerAddress, vetAddress, recordType,
     *         diagnosis, treatment, hospital, memo, visitDate }
     */
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addRecord(@RequestBody Map<String, Object> body) {
        Long petSbtId = body.containsKey("petSbtId")
                ? Long.parseLong(body.get("petSbtId").toString()) : null;

        if (petSbtId == null) {
            return ResponseEntity.badRequest().body(errorMap("petSbtId는 필수입니다."));
        }

        String diagnosis = getStr(body, "diagnosis");
        if (diagnosis.isBlank()) {
            return ResponseEntity.badRequest().body(errorMap("진단명(diagnosis)은 필수입니다."));
        }

        MedicalRecord record = new MedicalRecord();
        record.setPetSbtId(petSbtId);

        String ownerAddress = getStr(body, "ownerAddress");
        if (!ownerAddress.isBlank()) {
            record.setOwnerAddress(ownerAddress.toLowerCase());
        }
        String vetAddress = getStr(body, "vetAddress");
        if (!vetAddress.isBlank()) {
            record.setVetAddress(vetAddress.toLowerCase());
        }

        record.setRecordType(getStr(body, "recordType").isBlank() ? "진료" : getStr(body, "recordType"));

        // 민감 정보 AES-256 암호화 저장
        record.setDiagnosisEncrypted(encryptionService.encrypt(diagnosis));
        record.setTreatmentEncrypted(encryptionService.encrypt(getStr(body, "treatment")));
        record.setHospitalEncrypted(encryptionService.encrypt(getStr(body, "hospital")));
        record.setMemoEncrypted(encryptionService.encrypt(getStr(body, "memo")));

        if (body.containsKey("visitDate")) {
            record.setVisitDate(Long.parseLong(body.get("visitDate").toString()));
        }

        MedicalRecord saved = recordRepository.save(record);
        return ResponseEntity.ok(toDecryptedMap(saved));
    }

    /**
     * 반려동물 SBT ID로 진료기록 조회 (방문일 내림차순)
     * 복호화된 값으로 반환
     */
    @GetMapping("/{petSbtId}")
    public ResponseEntity<Map<String, Object>> getRecords(@PathVariable("petSbtId") Long petSbtId) {
        List<MedicalRecord> records = recordRepository.findByPetSbtIdOrderByVisitDateDesc(petSbtId);
        List<Map<String, Object>> decrypted = records.stream()
                .map(this::toDecryptedMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("records", decrypted);
        return ResponseEntity.ok(response);
    }

    /**
     * MedicalRecord → 복호화된 Map 변환
     * Map.of()는 최대 10쌍 제한 + 타입 혼합 추론 문제가 있어 LinkedHashMap 사용
     */
    private Map<String, Object> toDecryptedMap(MedicalRecord r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",           r.getId());
        map.put("petSbtId",     r.getPetSbtId());
        map.put("ownerAddress", r.getOwnerAddress() != null ? r.getOwnerAddress() : "");
        map.put("vetAddress",   r.getVetAddress()   != null ? r.getVetAddress()   : "");
        map.put("recordType",   r.getRecordType()   != null ? r.getRecordType()   : "");
        map.put("diagnosis",    safeDecrypt(r.getDiagnosisEncrypted()));
        map.put("treatment",    safeDecrypt(r.getTreatmentEncrypted()));
        map.put("hospital",     safeDecrypt(r.getHospitalEncrypted()));
        map.put("memo",         safeDecrypt(r.getMemoEncrypted()));
        map.put("visitDate",    r.getVisitDate() != null ? r.getVisitDate() : 0L);
        map.put("createdAt",    r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        return map;
    }

    private String safeDecrypt(String encrypted) {
        if (encrypted == null) return "";
        return encryptionService.decrypt(encrypted);
    }

    private String getStr(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? val.toString() : "";
    }

    private Map<String, Object> errorMap(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("error", message);
        return map;
    }
}
