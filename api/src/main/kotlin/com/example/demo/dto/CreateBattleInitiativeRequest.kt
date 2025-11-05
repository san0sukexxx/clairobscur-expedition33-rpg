package com.example.demo.dto

data class CreateBattleInitiativeRequest(
        val battleCharacterId: Int,
        val value: Int,
        val hability: Int,
        val playFirst: Boolean? = null
)
