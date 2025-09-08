package br.com.project.rpg.dto

data class CreateCampaignRequest(
    val nome: String,
    val personagemIds: List<String>
)