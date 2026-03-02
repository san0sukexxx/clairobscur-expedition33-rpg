package com.example.demo.dto

data class EncounterResponse(
        val id: Int,
        val campaignId: Int,
        val name: String,
        val npcs: List<EncounterNpcDto>,
        val rewards: List<EncounterRewardDto>
)
