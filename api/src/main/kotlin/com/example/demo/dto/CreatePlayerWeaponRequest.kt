package com.example.demo.dto

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class CreatePlayerWeaponRequest(
        @field:NotNull val playerId: Int,
        @field:NotBlank val weaponId: String,
        @field:Min(1) val level: Int = 1
)
