package br.com.project.rpg.campaign.create.dto

data class CreateCampaignRequest(
    val name: String,
    val characterIds: List<String>
)