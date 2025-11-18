package com.example.demo.dto

import com.example.demo.model.BattleLog
import com.example.demo.model.Attack

data class BattleWithDetailsResponse(
        val id: Int,
        val campaignId: Int,
        val battleStatus: String,
        val characters: List<BattleCharacterInfo>,
        val initiatives: List<InitiativeResponse>,
        val turns: List<BattleTurnResponse>,
        val battleLogs: List<BattleLog>?,
        val attacks: List<Attack>?
)
