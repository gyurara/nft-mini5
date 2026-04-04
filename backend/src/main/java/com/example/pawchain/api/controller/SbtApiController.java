package com.example.pawchain.api.controller;

import com.example.pawchain.api.dto.HasSbtResponse;
import com.example.pawchain.api.dto.SbtMintRequest;
import com.example.pawchain.api.dto.SbtMintResponse;
import com.example.pawchain.api.dto.VetApprovalRequest;
import com.example.pawchain.api.dto.VetApprovalResponse;
import com.example.pawchain.api.dto.VetRevocationResponse;
import com.example.pawchain.api.service.SbtService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sbt")
@CrossOrigin(origins = "*")
public class SbtApiController {

    private final SbtService sbtService;

    public SbtApiController(SbtService sbtService) {
        this.sbtService = sbtService;
    }

    @PostMapping("/mint")
    public SbtMintResponse mint(@RequestBody SbtMintRequest request) {
        return sbtService.mint(request);
    }

    @PostMapping("/approve-vet")
    public VetApprovalResponse approveVet(@RequestBody VetApprovalRequest request) {
        return sbtService.approveVet(request);
    }

    @PostMapping("/revoke-vet")
    public VetRevocationResponse revokeVet(@RequestBody VetApprovalRequest request) {
        return sbtService.revokeVet(request);
    }

    @GetMapping("/has/{ownerAddress}")
    public HasSbtResponse hasSbt(@PathVariable String ownerAddress) {
        return sbtService.hasSbt(ownerAddress);
    }
}
