package br.com.project.rpg.model

data class Campaign(
    val id: Long,
    val nome: String,
    val personagemIds: List<Long>
)