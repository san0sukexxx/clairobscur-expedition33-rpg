package br.com.project.rpg.service

import br.com.project.rpg.dto.CreateCampaignRequest
import br.com.project.rpg.model.Campaign
import org.springframework.stereotype.Service

@Service
class CampaignService {
    fun createCampaign(request: CreateCampaignRequest): Campaign {
        return Campaign(
            id = 1L,
            name = request.name,
            characterIds = request.characterIds
        )
    }
}