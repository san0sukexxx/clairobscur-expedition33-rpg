package br.com.project.rpg.campaign.controller

import br.com.project.rpg.campaign.dto.CreateCampaignRequest
import br.com.project.rpg.campaign.dto.CreateCampaignResponse
import br.com.project.rpg.campaign.service.CampaignService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/campaigns")
class CampaignController(
    private val service: CampaignService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun criar(@RequestBody @Valid body: CreateCampaignRequest): CreateCampaignResponse {
        return service.criar(body)
    }
}
