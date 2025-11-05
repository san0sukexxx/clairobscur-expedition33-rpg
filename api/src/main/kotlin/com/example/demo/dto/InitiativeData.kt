package com.example.demo.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class InitiativeData(
        @field:NotNull val initiativeValue: Int,
        @field:NotNull val hability: Int,
        @field:NotNull val playFirst: Boolean = false
)
