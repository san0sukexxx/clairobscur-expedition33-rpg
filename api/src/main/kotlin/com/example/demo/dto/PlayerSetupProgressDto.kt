package com.example.demo.dto

data class PlayerSetupProgressDto(
    val section: String,
    val done: Boolean
)

data class UpdateSetupProgressRequest(
    val section: String,
    val done: Boolean
)
