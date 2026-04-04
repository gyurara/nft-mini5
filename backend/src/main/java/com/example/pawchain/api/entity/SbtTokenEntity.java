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
@Table(name = "pet_sbt_tokens")
@Getter
@Setter
@NoArgsConstructor
public class SbtTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId;

    @Column(nullable = false, length = 42)
    private String ownerAddress;

    @Column(nullable = false, length = 15, unique = true)
    private String registrationNo;

    @Column(nullable = false, length = 20000)
    private String tokenUri;

    @Column(nullable = false, length = 66)
    private String txHash;

    @Column(nullable = false, length = 20000)
    private String metadataJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
