package com.example.demo.dto

data class GetPlayerResponse(
        val id: Int,
        val playerSheet: PlayerSheetResponse?,
        val weapons: List<PlayerWeaponResponse>?,
        val fightInfo: FightInfoResponse?,
        val isMasterEditing: Boolean?
)
