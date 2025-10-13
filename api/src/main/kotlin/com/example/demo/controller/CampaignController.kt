package com.example.demo.controller

import com.example.demo.dto.CampaignRequest
import com.example.demo.dto.CampaignResponse
import com.example.demo.model.Campaign
import com.example.demo.model.CampaignCharacter
import com.example.demo.repository.CampaignRepository
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/campaigns")
class CampaignController(private val repository: CampaignRepository) {
    @PostMapping
    fun create(@Valid @RequestBody request: CampaignRequest): ResponseEntity<Void> {
        return try {
            val campaign = Campaign(name = request.name)
            val characters =
                    request.characters.map {
                        CampaignCharacter(character = it.character, campaign = campaign)
                    }
            campaign.characters.addAll(characters)
            repository.save(campaign)
            ResponseEntity.ok().build()
        } catch (ex: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @GetMapping
    fun getAll(): ResponseEntity<List<CampaignResponse>> {
        val campaigns =
                repository.findAllWithCharacters().map { campaign ->
                    CampaignResponse(
                            id = campaign.id,
                            name = campaign.name,
                            characters = campaign.characters.map { it.character }
                    )
                }
        return ResponseEntity.ok(campaigns)
    }
}
