package com.example.demo.dto

data class BattleLogFeedResponse(
    val lastId: Int?,
    val logs: List<BattleLogInfo>
)