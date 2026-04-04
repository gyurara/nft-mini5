package com.example.pawchain.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pet_memory_nfts")
@Getter
@Setter
@NoArgsConstructor
public class MemoryNftEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId;

    @Column(nullable = false)
    private Long petSbtId;

    @Column(nullable = false, length = 80)
    private String eventType;

    @Column(nullable = false, length = 2048)
    private String imageUri;

    @Column(nullable = false, length = 42)
    private String ownerAddress;

    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal mintFee;

    @Column(nullable = false, length = 20000)
    private String tokenUri;

    @Column(nullable = false, length = 66)
    private String txHash;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
