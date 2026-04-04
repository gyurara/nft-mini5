package com.example.pawchain.api.repository;

import com.example.pawchain.api.entity.MemoryNftEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemoryNftRepository extends JpaRepository<MemoryNftEntity, Long> {
}
