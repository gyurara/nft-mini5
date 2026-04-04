package com.example.pawchain.api.controller;

import com.example.pawchain.api.dto.MedicalRecordAddRequest;
import com.example.pawchain.api.dto.MedicalRecordAddResponse;
import com.example.pawchain.api.dto.MedicalRecordResponse;
import com.example.pawchain.api.service.MedicalRecordService;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/record")
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/add")
    public MedicalRecordAddResponse addRecord(@RequestBody MedicalRecordAddRequest request) {
        return medicalRecordService.addRecord(request);
    }

    @GetMapping("/{petSbtId}")
    public List<MedicalRecordResponse> getRecords(@PathVariable Long petSbtId) {
        return medicalRecordService.getRecords(petSbtId);
    }
}
