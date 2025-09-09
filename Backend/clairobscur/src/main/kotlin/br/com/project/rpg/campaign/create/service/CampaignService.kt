package br.com.project.rpg.campaign.create.service

import br.com.project.rpg.campaign.create.dto.CreateCampaignRequest
import br.com.project.rpg.campaign.create.model.Campaign
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