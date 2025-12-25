package com.example.demo.dto

data class BattleCharacterInfo(
    val battleID: Int?,
    val id: String,
    val name: String,
    val healthPoints: Int,
    val maxHealthPoints: Int,
    val magicPoints: Int?,
    val maxMagicPoints: Int?,
    val chargePoints: Int?,
    val maxChargePoints: Int?,
    val sunCharges: Int?,
    val moonCharges: Int?,
    val gradientPoints: Int?,
    val stance: String?,
    val status: List<BattleStatusResponse>?,
    val type: String,
    val isEnemy: Boolean,
    val canRollInitiative: Boolean
)