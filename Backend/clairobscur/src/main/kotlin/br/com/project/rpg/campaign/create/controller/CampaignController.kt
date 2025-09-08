package br.com.project.rpg.campanha.criar.controller

import org.springframework.web.bind.annotation.*
import br.com.project.rpg.dto.CreateCampaignRequest
import br.com.project.rpg.model.Campaign
import br.com.project.rpg.service.CampaignService

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