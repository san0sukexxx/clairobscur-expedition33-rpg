package com.example.demo.dto

data class UpdatePlayerRequest(val playerSheet: PlayerSheetUpdateRequest)

data class PlayerSheetUpdateRequest(
        val name: String?,
        val characterId: String?,
        val totalPoints: Int?,
        val xp: Int?,
        val apCurrent: Int?,
        val mpCurrent: Int?,
        val hpCurrent: Int?,
        val notes: String?,
        val weaponId: String?,
        val skillsData: String? = null,
        val hpMax: Int? = null,
        val savingThrowProficiencies: List<String>? = null,
        val abilityScores: AbilityScoresDto? = null,
        val luminaBonusPoints: Int? = null
)
