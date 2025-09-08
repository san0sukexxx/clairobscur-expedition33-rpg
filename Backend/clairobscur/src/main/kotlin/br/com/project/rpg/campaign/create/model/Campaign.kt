package br.com.project.rpg.model

data class Campaign(
    val id: Long,
    val name: String,
    val characterIds: List<String>
)