package com.example.demo.dto

data class GetAttacksResponse(
        val id: Int,
        val battleId: Int,
        val totalPower: Int,
        val targetBattleId: Int,
        val sourceBattleId: Int,
        val isResolved: Boolean,
        val effects: List<AttackStatusEffectResponse>
)
