package com.example.demo.controller

import com.example.demo.dto.CreateCampaignResponse
import com.example.demo.dto.ListCampaignRequest
import com.example.demo.dto.ListCampaignResponse
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
            @Valid @RequestBody request: ListCampaignRequest
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
    fun getAll(): ResponseEntity<List<ListCampaignResponse>> {
        val campaigns =
                repository.findAllWithCharacters().map { campaign ->
                    ListCampaignResponse(
                            id = campaign.id,
                            name = campaign.name,
                            characters = campaign.characters.map { it.character }
                    )
                }
        return ResponseEntity.ok(campaigns)
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Int): ResponseEntity<ListCampaignResponse> {
        val opt = repository.findByIdWithCharacters(id)
        return if (opt.isPresent) {
            val c = opt.get()
            ResponseEntity.ok(
                    ListCampaignResponse(
                            id = c.id,
                            name = c.name,
                            characters = c.characters.map { it.character }
                    )
            )
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/{id}/characters")
    fun getCharacters(@PathVariable id: Int): ResponseEntity<List<String>> {
        val opt = repository.findByIdWithCharacters(id)
        return if (opt.isPresent) {
            val chars = opt.get().characters.map { it.character }
            ResponseEntity.ok(chars)
        } else {
            ResponseEntity.notFound().build()
        }
    }
}
