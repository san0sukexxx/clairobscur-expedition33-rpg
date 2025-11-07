package com.example.demo.dto

data class BattleTurnResponse(
        val id: Int,
        val battleId: Int,
        val playOrder: Int,
        val battleCharacterId: Int
)
