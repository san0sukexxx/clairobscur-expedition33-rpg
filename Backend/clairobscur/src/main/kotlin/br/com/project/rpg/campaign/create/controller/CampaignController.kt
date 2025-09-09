package br.com.project.rpg.campaign.create.controller

import br.com.project.rpg.campaign.create.dto.CreateCampaignRequest
import br.com.project.rpg.campaign.create.model.Campaign
import br.com.project.rpg.campaign.create.service.CampaignService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("/campaing/create")
class CampaignController(
    private val campaignService: CampaignService
) {
    @PostMapping
    fun createCmpaingnController(@RequestBody request: CreateCampaignRequest): Campaign {
        return campaignService.createCampaign(request)
    }
}