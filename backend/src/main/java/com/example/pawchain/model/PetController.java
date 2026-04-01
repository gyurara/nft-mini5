package com.example.pawchain.controller;

import com.example.pawchain.model.Pet;
import com.example.pawchain.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pets")
@CrossOrigin(origins = "*")
public class PetController {
    @Autowired
    private PetRepository petRepository;

    @PostMapping
    public Pet registerPet(@RequestBody Pet pet) {
        return petRepository.save(pet);
    }

    @GetMapping("/{address}")
    public List<Pet> getMyPets(@PathVariable String address) {
        return petRepository.findByOwnerAddressIgnoreCase(address);
    }
}