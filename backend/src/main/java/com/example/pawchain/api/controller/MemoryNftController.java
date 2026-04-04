package com.example.pawchain.api.controller;

import com.example.pawchain.api.dto.MemoryNftMintRequest;
import com.example.pawchain.api.dto.MemoryNftMintResponse;
import com.example.pawchain.api.service.MemoryNftService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nft")
@CrossOrigin(origins = "*")
public class MemoryNftController {

    private final MemoryNftService memoryNftService;

    public MemoryNftController(MemoryNftService memoryNftService) {
        this.memoryNftService = memoryNftService;
    }

    @PostMapping("/mint-memory")
    public MemoryNftMintResponse mintMemory(@RequestBody MemoryNftMintRequest request) {
        return memoryNftService.mint(request);
    }
}
