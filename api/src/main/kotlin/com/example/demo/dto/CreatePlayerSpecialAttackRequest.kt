package com.example.demo.dto

data class CreatePlayerSpecialAttackRequest(
        val playerId: Int,
        val specialAttackId: String,
        val slot: Int? = null
)
