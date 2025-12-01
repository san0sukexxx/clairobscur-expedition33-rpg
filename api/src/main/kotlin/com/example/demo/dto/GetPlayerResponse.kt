package com.example.demo.dto

import com.example.demo.model.BattleLog
import com.example.demo.model.PlayerPicto

data class GetPlayerResponse(
        val id: Int,
        val playerSheet: PlayerSheetResponse?,
        val weapons: List<PlayerWeaponResponse>?,
        val fightInfo: FightInfoResponse?,
        val isMasterEditing: Boolean?,
        val battleLogs: List<BattleLog>?,
        val pictos: List<PlayerPicto>?
)
