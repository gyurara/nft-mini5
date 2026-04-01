package com.example.pawchain.model;

import jakarta.persistence.*; // Spring Boot 3 버전 필수
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "pets")
public class Pet {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String ownerAddress; // 지갑 주소
    private String name;         // 이름
    private String type;         // 종류
    private String txHash;       // 블록체인 거래 해시
}