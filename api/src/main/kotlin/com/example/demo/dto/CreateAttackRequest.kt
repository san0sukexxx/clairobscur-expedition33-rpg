package com.example.demo.dto

data class CreateAttackRequest(
        val totalDamage: Int?,
        val totalPower: Int?,
        val targetBattleId: Int,
        val sourceBattleId: Int,
        val effects: List<StatusEffectRequest> = emptyList(),
        val attackType: String?,
        val skillCost: Int? = null,
        val consumesCharge: Boolean? = null
)