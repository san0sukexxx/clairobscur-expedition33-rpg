package com.example.demo.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class AddBattleCharacterRequest(
        @field:NotBlank val externalId: String,
        @field:NotBlank val characterName: String,
        @field:NotBlank val characterType: String,
        @field:NotNull val team: String,
        @field:NotNull val healthPoints: Int,
        @field:NotNull val maxHealthPoints: Int,
        val magicPoints: Int? = null,
        val maxMagicPoints: Int? = null,
        val initiative: InitiativeData? = null,
        val canRollInitiative: Boolean = false
)