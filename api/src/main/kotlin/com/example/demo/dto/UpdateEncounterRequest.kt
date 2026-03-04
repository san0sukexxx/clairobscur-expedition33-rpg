package com.example.demo.dto

data class UpdateEncounterRequest(
        val locationId: String? = null,
        val npcs: List<EncounterNpcDto>,
        val rewards: List<EncounterRewardDto>
)
