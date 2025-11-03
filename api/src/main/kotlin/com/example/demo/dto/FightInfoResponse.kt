package com.example.demo.dto

import com.example.demo.dto.BattleStatusResponse

data class FightInfoResponse(
    val playerBattleID: Int?,
    val initiatives: List<InitiativeResponse>?,
    val characters: List<BattleCharacterInfo>?,
    val battleStatus: String,
    val canRollInitiative: Boolean
)