package com.example.demo.dto

data class BattleCharacterInfo(
    val battleID: Int,
    val id: String,
    val name: String,
    val healthPoints: Int,
    val maxHealthPoints: Int,
    val magicPoints: Int?,
    val maxMagicPoints: Int?,
    val status: List<BattleStatusResponse>?,
    val type: String,
    val isEnemy: Boolean
)