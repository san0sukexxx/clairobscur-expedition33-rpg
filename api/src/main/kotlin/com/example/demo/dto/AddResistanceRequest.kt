package com.example.demo.dto

data class AddResistanceRequest(
        val element: String,
        val resistanceType: String, // 'immune', 'resist', 'weak'
        val multiplier: Double // 0.0 for immune, 0.5 for resist, 1.5 for weak, etc.
)
