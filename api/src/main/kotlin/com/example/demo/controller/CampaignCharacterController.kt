package com.example.demo.controller

import com.example.demo.dto.CampaignCharacterResponse
import com.example.demo.repository.CampaignCharacterRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/campaigns")
class CampaignCharacterController(
        private val campaignCharacterRepository: CampaignCharacterRepository
) {
    @GetMapping("/{campaignId}/characters")
    fun listByCampaign(
            @PathVariable campaignId: Int
    ): ResponseEntity<List<CampaignCharacterResponse>> {

        val results = campaignCharacterRepository.findAllByCampaignId(campaignId)
        val body = results.map { CampaignCharacterResponse.fromEntity(it) }

        return ResponseEntity.ok(body)
    }
}
