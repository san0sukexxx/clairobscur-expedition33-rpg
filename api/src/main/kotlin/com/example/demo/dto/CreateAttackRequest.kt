package com.example.demo.dto

data class CreateAttackRequest(
        val totalDamage: Int?,
        val totalPower: Int?,
        val targetBattleId: Int,
        val sourceBattleId: Int,
        val effects: List<StatusEffectRequest> = emptyList(),
        val attackType: String?,
        val skillCost: Int? = null,
        val consumesCharge: Boolean? = null,
        val isGradient: Boolean? = null,
        val destroysShields: Boolean? = null,
        val grantsAPPerShield: Int? = null,
        val consumesBurn: Int? = null,
        val consumesForetell: Int? = null,  // Number of Foretell stacks to consume from target
        val executionThreshold: Int? = null,
        val skillType: String? = null,  // "sun" or "moon" for Sciel's charge system
        val bestialWheelAdvance: Int? = null,  // Advances Monoco's Bestial Wheel by this many positions
        val isFirstHit: Boolean? = null,  // Indicates if this is the first hit for damage modifier purposes
        val element: String? = null  // Element type for elemental resistances (e.g., 'Physical', 'Fire', 'Ice')
)