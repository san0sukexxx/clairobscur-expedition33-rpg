package com.example.demo.dto

data class GetCampaignResponse(
        val id: Int,
        val name: String,
        val battleId: Int?,
        val characters: List<String>,
        val latestEventID: Int?
)
