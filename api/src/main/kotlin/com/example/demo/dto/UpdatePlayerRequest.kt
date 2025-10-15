package com.example.demo.dto

data class UpdatePlayerRequest(val playerSheet: PlayerSheetUpdateRequest)

data class PlayerSheetUpdateRequest(
        val name: String?,
        val characterId: String?,
        val totalPoints: Int?,
        val xp: Int?,
        val power: Int?,
        val hability: Int?,
        val resistance: Int?,
        val apCurrent: Int?,
        val mpCurrent: Int?,
        val hpCurrent: Int?,
        val notes: String?,
        val weaponId: String?
)
