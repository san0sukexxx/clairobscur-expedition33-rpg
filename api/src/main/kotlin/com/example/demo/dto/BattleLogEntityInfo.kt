package com.example.demo.dto

data class BattleLogEntityInfo(
        val battleLogId: Int,
        val battleCharacterId: Int,
        val isSource: Boolean,
        val isTarget: Boolean
)
