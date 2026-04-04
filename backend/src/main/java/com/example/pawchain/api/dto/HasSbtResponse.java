package com.example.pawchain.api.dto;

import java.util.List;

public record HasSbtResponse(
    boolean hasSBT,
    List<Long> tokenIds
) {
}
