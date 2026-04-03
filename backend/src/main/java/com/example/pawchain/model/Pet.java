package com.example.pawchain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "pets")
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ownerAddress;
    private String name;
    private String type;
    private String species;
    private String birthDate;

    private String txHash;
    private Long   tokenId;

    @Column(length = 100000)
    private String image;

    @Column(length = 64, unique = false)
    private String imageHash;

    private Integer likeCount  = 0;
    private Integer nftValue   = 1000;

    private LocalDateTime createdAt = LocalDateTime.now();

    public void recalculateValue() {
        this.nftValue = 1000 + (this.likeCount == null ? 0 : this.likeCount) * 5;
    }
}
