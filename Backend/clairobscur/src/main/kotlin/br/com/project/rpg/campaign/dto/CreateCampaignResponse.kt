package br.com.project.rpg.campaign.dto

import java.time.Instant

data class CreateCampaignResponse(
    val id: Long,
    val nome: String,
    val personagemId: Long,
    val criadoEm: Instant
)