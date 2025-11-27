package com.example.demo.dto

data class BattleStatusResponse(
    val effectName: String,
    val ammount: Int,
    val remainingTurns: Int?
)