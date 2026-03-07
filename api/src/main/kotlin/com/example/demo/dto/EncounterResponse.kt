package com.example.demo.dto

data class EncounterResponse(
        val id: Int,
        val campaignId: Int,
        val locationId: String?,
        val name: String?,
        val storyOrder: Int,
        val bonusXp: Int,
        val npcs: List<EncounterNpcDto>,
        val rewards: List<EncounterRewardDto>
)
