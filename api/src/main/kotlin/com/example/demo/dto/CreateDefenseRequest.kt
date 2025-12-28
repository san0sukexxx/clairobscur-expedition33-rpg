package com.example.demo.dto

data class CreateDefenseRequest(
    val attackId: Int?,
    val totalDamage: Int?,
    val defenseType: String? = null  // "block", "dodge", "jump", "gradient-block", "take"
)
