package com.example.demo.dto

import com.example.demo.model.Attack
import com.example.demo.dto.AttackResponse

data class FightInfoResponse(
        val battleId: Int?,
        val playerBattleID: Int?,
        val initiatives: List<InitiativeResponse>?,
        val characters: List<BattleCharacterInfo>?,
        val battleStatus: String,
        val canRollInitiative: Boolean,
        val turns: List<BattleTurnResponse>? = null,
        val pendingAttacks: List<AttackResponse>? = null
)
