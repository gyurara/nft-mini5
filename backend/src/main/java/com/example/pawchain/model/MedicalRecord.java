package com.example.pawchain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 진료기록 엔티티 - 민감 정보(진단명, 치료, 메모)는 AES-256 암호화하여 저장
 * 프론트(feVite) animalApi.addMedicalRecord / getMedicalRecords 에서 사용
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 반려동물 SBT 토큰 ID */
    private Long petSbtId;

    /** 보호자 지갑 주소 */
    private String ownerAddress;

    /** 진료한 병원 지갑 주소 */
    private String vetAddress;

    /** 기록 유형 (예: 진료, 검진, 예방접종 등) */
    @Column(length = 80)
    private String recordType;

    /** 진단명 - AES-256 암호화 저장 */
    @Column(columnDefinition = "TEXT")
    private String diagnosisEncrypted;

    /** 치료 내용 - AES-256 암호화 저장 */
    @Column(columnDefinition = "TEXT")
    private String treatmentEncrypted;

    /** 병원명 - AES-256 암호화 저장 */
    @Column(columnDefinition = "TEXT")
    private String hospitalEncrypted;

    /** 메모 - AES-256 암호화 저장 */
    @Column(columnDefinition = "TEXT")
    private String memoEncrypted;

    /** 방문일 (Unix timestamp, 초 단위) */
    private Long visitDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() {
        // updatedAt 필요 시 추가
    }
}
