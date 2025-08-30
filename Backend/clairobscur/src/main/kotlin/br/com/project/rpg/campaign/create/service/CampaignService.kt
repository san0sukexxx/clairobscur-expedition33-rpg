package br.com.project.rpg.service

import br.com.project.rpg.dto.CreateCampaignRequest
import br.com.project.rpg.model.Campaign
import org.springframework.stereotype.Service

@Service
class CampaignService {
    fun createCampaign(request: CreateCampaignRequest): Campaign {
        // Exemplo simples, substitua pela lógica real
        return Campaign(
            id = 1L,
            nome = request.nome,
            personagemIds = request.personagemIds
        )
    }
}