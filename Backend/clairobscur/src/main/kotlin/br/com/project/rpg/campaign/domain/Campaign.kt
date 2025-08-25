package br.com.project.rpg.campaign.domain

import java.time.Instant

data class Campaign(
    val id: Long,
    val nome: String,
    val personagemId: Long,
    val criadoEm: Instant = Instant.now()
)
