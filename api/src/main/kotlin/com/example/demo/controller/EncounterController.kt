package com.example.demo.controller

import com.example.demo.dto.*
import com.example.demo.model.Encounter
import com.example.demo.model.EncounterNpc
import com.example.demo.model.EncounterReward
import com.example.demo.repository.EncounterNpcRepository
import com.example.demo.repository.EncounterRepository
import com.example.demo.repository.EncounterRewardRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/encounters")
class EncounterController(
        private val encounterRepository: EncounterRepository,
        private val encounterNpcRepository: EncounterNpcRepository,
        private val encounterRewardRepository: EncounterRewardRepository
) {

    @GetMapping("/campaign/{campaignId}")
    fun listByCampaign(@PathVariable campaignId: Int): ResponseEntity<List<EncounterResponse>> {
        val encounters = encounterRepository.findByCampaignId(campaignId)
        val responses = encounters.map { buildResponse(it) }
        return ResponseEntity.ok(responses)
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Int): ResponseEntity<EncounterResponse> {
        val encounter = encounterRepository.findById(id).orElse(null)
                ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(buildResponse(encounter))
    }

    @PostMapping
    fun create(@RequestBody request: CreateEncounterRequest): ResponseEntity<EncounterResponse> {
        val encounter = encounterRepository.save(
                Encounter(campaignId = request.campaignId, name = request.name)
        )
        return ResponseEntity.ok(buildResponse(encounter))
    }

    @Transactional
    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody request: UpdateEncounterRequest
    ): ResponseEntity<EncounterResponse> {
        val encounter = encounterRepository.findById(id).orElse(null)
                ?: return ResponseEntity.notFound().build()

        encounter.name = request.name
        encounterRepository.save(encounter)

        // Replace all NPCs
        encounterNpcRepository.deleteByEncounterId(id)
        request.npcs.forEach { npcDto ->
            encounterNpcRepository.save(
                    EncounterNpc(encounterId = id, npcId = npcDto.npcId, quantity = npcDto.quantity)
            )
        }

        // Replace all rewards
        encounterRewardRepository.deleteByEncounterId(id)
        request.rewards.forEach { rewardDto ->
            encounterRewardRepository.save(
                    EncounterReward(
                            encounterId = id,
                            rewardType = rewardDto.rewardType,
                            itemId = rewardDto.itemId,
                            level = rewardDto.level
                    )
            )
        }

        return ResponseEntity.ok(buildResponse(encounter))
    }

    @Transactional
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Unit> {
        if (!encounterRepository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }
        encounterRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }

    private fun buildResponse(encounter: Encounter): EncounterResponse {
        val encId = encounter.id!!
        val npcs = encounterNpcRepository.findByEncounterId(encId).map {
            EncounterNpcDto(npcId = it.npcId, quantity = it.quantity)
        }
        val rewards = encounterRewardRepository.findByEncounterId(encId).map {
            EncounterRewardDto(rewardType = it.rewardType, itemId = it.itemId, level = it.level)
        }
        return EncounterResponse(
                id = encId,
                campaignId = encounter.campaignId,
                name = encounter.name,
                npcs = npcs,
                rewards = rewards
        )
    }
}
