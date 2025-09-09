package br.com.project.rpg.campaign.create.dto

data class CampaignResponse(
    val id: Int,
    val name: String,
    val characterIds: List<Long>
)