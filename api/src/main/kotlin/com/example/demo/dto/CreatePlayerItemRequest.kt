package com.example.demo.dto

data class CreatePlayerItemRequest(
        val playerId: Int,
        val itemId: String,
        val quantity: Int = 1,
        val maxQuantity: Int = 99
)
