package com.example.demo.dto

data class ApplyAsiRequest(
        val level: Int,
        val attribute1: String,
        val amount1: Int,
        val attribute2: String? = null,
        val amount2: Int? = null
)
