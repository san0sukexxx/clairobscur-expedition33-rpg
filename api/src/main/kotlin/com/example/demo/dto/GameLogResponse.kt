package com.example.demo.dto

data class GameLogResponse(
    val id: Int,
    val playerId: Int,
    val playerName: String?,
    val characterId: String?,
    val rollType: String,
    val abilityKey: String?,
    val skillId: String?,
    val senseKey: String?,
    val diceRolled: Int,
    val modifier: Int,
    val total: Int,
    val diceCommand: String,
    val createdAt: String
)
