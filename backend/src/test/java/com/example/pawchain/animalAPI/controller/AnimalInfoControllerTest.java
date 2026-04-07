package com.example.pawchain.animalAPI.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;

import com.example.animalAPI.config.AnimalApiProperties;
import com.example.animalAPI.controller.AnimalInfoController;
import com.example.animalAPI.dto.AnimalInfoResponse;
import com.example.animalAPI.exception.AnimalApiException;
import com.example.animalAPI.exception.GlobalExceptionHandler;
import com.example.animalAPI.service.AnimalInfoService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnimalInfoController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AnimalInfoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnimalInfoService animalInfoService;

    @MockBean
    private AnimalApiProperties animalApiProperties;

    @Test
    void returnsAnimalInfo() throws Exception {
        when(animalInfoService.getAnimalInfo(any())).thenReturn(
            new AnimalInfoResponse("410123456789012", "410123456789012", "20200101", "초코", "암", "말티즈", "Y")
        );

        mockMvc.perform(get("/api/animal/info")
                .param("dog_reg_no", "410123456789012")
                .param("rfid_cd", "410123456789012")
                .param("owner_nm", "홍길동")
                .param("owner_birth", "900520"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dogRegNo").value("410123456789012"))
            .andExpect(jsonPath("$.dogNm").value("초코"));
    }

    @Test
    void returnsBadRequestWhenOwnerBirthIsInvalid() throws Exception {
        when(animalInfoService.getAnimalInfo(any()))
            .thenThrow(new AnimalApiException(HttpStatus.BAD_REQUEST, "owner_birth는 6자리 숫자(주민번호 앞자리)여야 합니다."));

        mockMvc.perform(get("/api/animal/info")
                .param("dog_reg_no", "410123456789012")
                .param("rfid_cd", "410123456789012")
                .param("owner_nm", "홍길동")
                .param("owner_birth", "90052A"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("owner_birth는 6자리 숫자(주민번호 앞자리)여야 합니다."));
    }

    @Test
    void returnsBadRequestWhenRequiredParamIsMissing() throws Exception {
        mockMvc.perform(get("/api/animal/info")
                .param("dog_reg_no", "410123456789012")
                .param("rfid_cd", "410123456789012")
                .param("owner_nm", "홍길동"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("owner_birth 파라미터는 필수입니다."));
    }
}
