package com.example.demo.dto

data class ApplyStatusRequest(
    val battleCharacterId: Int,
    val effectType: String,
    val totalValue: Int
)