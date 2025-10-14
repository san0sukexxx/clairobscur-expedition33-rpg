package com.example.demo.controller

import com.example.demo.dto.CampaignRequest
import com.example.demo.dto.CampaignResponse
import com.example.demo.dto.CreateCampaignResponse
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
    fun create(
            @Valid @RequestBody request: CampaignRequest
    ): ResponseEntity<CreateCampaignResponse> {
        return try {
            val campaign = Campaign(name = request.name)

            val characters =
                    request.characters.map { ch ->
                        CampaignCharacter(character = ch, campaign = campaign)
                    }
            campaign.characters.addAll(characters)

            val saved = repository.save(campaign)
            val id = requireNotNull(saved.id) { "ID não gerado pelo persist." }

            ResponseEntity.ok(CreateCampaignResponse(id))
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
