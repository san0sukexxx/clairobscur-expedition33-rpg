package com.example.demo.dto

data class UseItemRequest(
    val playerId: Int,
    val itemId: String,
    val maxHp: Int,
    val maxMp: Int,
    val recoveryPercent: Int?,
    val targetBattleCharacterId: Int?
)
