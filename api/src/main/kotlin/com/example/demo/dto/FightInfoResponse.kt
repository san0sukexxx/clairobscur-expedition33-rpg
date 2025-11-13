package com.example.demo.dto

data class FightInfoResponse(
    val battleId: Int?,
    val playerBattleID: Int?,
    val initiatives: List<InitiativeResponse>?,
    val characters: List<BattleCharacterInfo>?,
    val battleStatus: String,
    val canRollInitiative: Boolean,
    val turns: List<BattleTurnResponse>? = null
)
