package com.example.demo.dto

data class AttackResponse(
    val id: Int,
    val battleId: Int,
    val totalPower: Int,
    val targetBattleId: Int,
    val sourceBattleId: Int,
    val totalDefended: Int?,
    val allowCounter: Boolean,
    val isResolved: Boolean,
    val isCounterResolved: Boolean,
    val effects: List<AttackStatusEffectResponse>
)
