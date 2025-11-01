package com.example.demo.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class CreateBattleRequest(
        @field:NotNull val campaignId: Int,
        @field:NotBlank val battleStatus: String
)
