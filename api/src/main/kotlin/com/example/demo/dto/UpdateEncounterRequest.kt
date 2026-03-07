package com.example.demo.dto

data class UpdateEncounterRequest(
        val locationId: String? = null,
        val name: String? = null,
        val npcs: List<EncounterNpcDto>,
        val rewards: List<EncounterRewardDto>,
        val bonusXp: Int? = null,
        val storyOrder: Int? = null
)
