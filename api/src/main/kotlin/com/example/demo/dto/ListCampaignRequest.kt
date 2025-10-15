package com.example.demo.dto

import jakarta.validation.constraints.NotBlank

data class ListCampaignRequest(
        @field:NotBlank val name: String,
        val characters: List<String> = emptyList()
)
