package com.example.demo.dto

data class UpdateEncounterRequest(
        val name: String,
        val npcs: List<EncounterNpcDto>,
        val rewards: List<EncounterRewardDto>
)
