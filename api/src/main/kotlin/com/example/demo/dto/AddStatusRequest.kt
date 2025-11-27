package com.example.demo.dto

data class AddStatusRequest(
        val battleCharacterId: Int,
        val effectType: String,
        val ammount: Int,
        val remainingTurns: Int?
)
