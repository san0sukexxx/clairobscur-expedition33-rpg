package br.com.project.rpg.campaign.repository

import br.com.project.rpg.campaign.domain.Campaign

interface CampaignRepository {
    fun salvar(campaign: Campaign): Campaign
}
