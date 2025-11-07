package com.example.demo.dto

import com.example.demo.model.BattleCharacter

data class BattleWithDetailsResponse(
    val id: Int,
    val campaignId: Int,
    val battleStatus: String,
    val characters: List<BattleCharacterInfo>,
    val initiatives: List<InitiativeResponse>,
    val turns: List<BattleTurnResponse>
)
