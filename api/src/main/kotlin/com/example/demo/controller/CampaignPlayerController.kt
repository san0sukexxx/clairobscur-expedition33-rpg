package com.example.demo.controller

import com.example.demo.dto.GetPlayerResponse
import com.example.demo.service.CampaignPlayerService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/campaigns/{campaignId}/players")
class CampaignPlayerController(private val campaignPlayerService: CampaignPlayerService) {
    @GetMapping
    fun list(@PathVariable campaignId: Int): ResponseEntity<List<GetPlayerResponse>> {
        return ResponseEntity.ok(campaignPlayerService.listPlayersByCampaign(campaignId))
    }

    @DeleteMapping("/{playerId}")
    fun delete(@PathVariable campaignId: Int, @PathVariable playerId: Int): ResponseEntity<Void> {
        campaignPlayerService.deletePlayerFromCampaign(campaignId, playerId)
        return ResponseEntity.noContent().build()
    }
}
