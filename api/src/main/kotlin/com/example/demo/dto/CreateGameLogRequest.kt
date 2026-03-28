package com.example.demo.dto

data class CreateGameLogRequest(
    val rollType: String,
    val abilityKey: String? = null,
    val skillId: String? = null,
    val senseKey: String? = null,
    val diceRolled: Int,
    val modifier: Int,
    val total: Int,
    val diceCommand: String
)
