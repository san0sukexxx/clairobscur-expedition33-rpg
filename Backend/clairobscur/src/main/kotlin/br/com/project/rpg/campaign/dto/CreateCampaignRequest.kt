package br.com.project.rpg.campaign.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class CreateCampaignRequest(
    @field:NotBlank(message = "O nome da campanha é obrigatório.")
    @field:Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
    val nome: String?,

    @field:NotNull(message = "O id do personagem é obrigatório.")
    @field:Positive(message = "O id do personagem deve ser positivo.")
    val personagemId: Long?
)