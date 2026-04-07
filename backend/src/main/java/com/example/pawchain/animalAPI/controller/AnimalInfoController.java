package com.example.pawchain.animalAPI.controller;

import com.example.pawchain.animalAPI.dto.AnimalInfoRequest;
import com.example.pawchain.animalAPI.dto.AnimalInfoResponse;
import com.example.pawchain.animalAPI.service.AnimalInfoService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/animal")
@CrossOrigin(origins = "*")
public class AnimalInfoController {
    private final AnimalInfoService animalInfoService;

    public AnimalInfoController(AnimalInfoService animalInfoService) {
        this.animalInfoService = animalInfoService;
    }

    @GetMapping("/info")
    public AnimalInfoResponse getAnimalInfo(
        @RequestParam("dog_reg_no") String dogRegNo,
        @RequestParam("rfid_cd") String rfidCd,
        @RequestParam("owner_nm") String ownerNm,
        @RequestParam("owner_birth") String ownerBirth
    ) {
        return animalInfoService.getAnimalInfo(new AnimalInfoRequest(dogRegNo, rfidCd, ownerNm, ownerBirth));
    }
}
