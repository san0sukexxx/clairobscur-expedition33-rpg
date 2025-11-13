package com.example.demo.dto

data class BattleLogInfo(
    val id: Int,
    val battleId: Int,
    val eventType: String,
    val eventDescription: String?,
    val eventValue: String?,
    val entities: List<BattleLogEntityInfo>
)