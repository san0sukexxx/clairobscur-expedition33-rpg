package com.example.demo.dto

import com.example.demo.model.BattleLog
import com.example.demo.model.PlayerPicto
import com.example.demo.model.PlayerLumina
import com.example.demo.model.PlayerItem
import com.example.demo.model.PlayerSkill

data class GetPlayerResponse(
        val id: Int,
        val playerSheet: PlayerSheetResponse?,
        val weapons: List<PlayerWeaponResponse>?,
        val fightInfo: FightInfoResponse?,
        val isMasterEditing: Boolean?,
        val battleLogs: List<BattleLog>?,
        val pictos: List<PlayerPicto>?,
        val luminas: List<PlayerLumina>?,
        val items: List<PlayerItem>?,
        val skills: List<PlayerSkill>?
)
