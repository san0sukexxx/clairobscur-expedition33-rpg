package com.example.demo.dto

data class CreateEncounterRequest(
        val campaignId: Int,
        val locationId: String? = null,
        val storyOrder: Int? = null
)
