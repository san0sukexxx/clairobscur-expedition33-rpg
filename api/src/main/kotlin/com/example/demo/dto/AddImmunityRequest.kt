package com.example.demo.dto

data class AddImmunityRequest(
        val statusType: String,
        val immunityType: String, // 'immune' or 'resist'
        val resistChance: Int? = null // For 'resist' type, chance to avoid (0-100)
)
