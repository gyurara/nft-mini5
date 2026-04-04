package com.example.pawchain.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pet_medical_records")
@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long petSbtId;

    @Column(nullable = false, length = 80)
    private String recordType;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 42)
    private String vetAddress;

    @Column(nullable = false, length = 128)
    private String ipfsHash;

    @Column(nullable = false, length = 66)
    private String txHash;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
