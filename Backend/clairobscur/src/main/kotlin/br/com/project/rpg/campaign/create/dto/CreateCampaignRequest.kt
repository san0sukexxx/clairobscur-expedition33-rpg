package br.com.project.rpg.dto

data class CreateCampaignRequest(
    val name: String,
    val characterIds: List<String>
)