package com.example.demo.dto

import jakarta.validation.constraints.NotBlank

data class CampaignCharacterRequest(@field:NotBlank val character: String)

data class CampaignRequest(
        @field:NotBlank val name: String,
        val characters: List<CampaignCharacterRequest> = emptyList()
)
