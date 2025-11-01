package com.example.demo.controller

import com.example.demo.dto.UseBattleRequest
import com.example.demo.model.Battle
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.CampaignRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battles")
class BattleController(
        private val battleRepository: BattleRepository,
        private val campaignRepository: CampaignRepository
) {

    @GetMapping("/{battleId}")
    fun getBattleById(@PathVariable battleId: Int): ResponseEntity<Battle> {
        val opt = battleRepository.findById(battleId)
        return if (opt.isPresent) ResponseEntity.ok(opt.get())
        else ResponseEntity.notFound().build()
    }

    @GetMapping("/campaign/{campaignId}")
    fun getBattlesByCampaign(@PathVariable campaignId: Int): ResponseEntity<List<Battle>> {
        val battles = battleRepository.findByCampaignId(campaignId)
        return ResponseEntity.ok(battles)
    }

    @PostMapping
    fun create(@RequestBody battle: Battle): ResponseEntity<Int> {
        val saved = battleRepository.save(battle)
        return ResponseEntity.ok(saved.id!!)
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody updated: Battle): ResponseEntity<Battle> {
        val opt = battleRepository.findById(id)
        return if (opt.isPresent) {
            val existing = opt.get()
            val newBattle = existing.copy(battleStatus = updated.battleStatus)
            battleRepository.save(newBattle)
            ResponseEntity.ok().build()
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Unit> {
        if (battleRepository.existsById(id)) {
            battleRepository.deleteById(id)
            return ResponseEntity.noContent().build()
        }
        return ResponseEntity.notFound().build()
    }

    @PutMapping("/{battleId}/use")
    fun useBattle(
            @PathVariable battleId: Int,
            @RequestBody body: UseBattleRequest
    ): ResponseEntity<Void> {
        val campaignId = body.campaignId

        val campaign =
                campaignRepository.findById(campaignId).orElseThrow {
                    IllegalArgumentException("Campaign not found with id: $campaignId")
                }

        campaign.battleId = battleId
        campaignRepository.save(campaign)

        return ResponseEntity.ok().build()
    }

    @PutMapping("/clear")
    fun clearBattle(@RequestBody body: UseBattleRequest): ResponseEntity<Void> {
        val campaignId = body.campaignId

        val campaign =
                campaignRepository.findById(campaignId).orElseThrow {
                    IllegalArgumentException("Campaign not found with id: $campaignId")
                }

        campaign.battleId = null
        campaignRepository.save(campaign)

        return ResponseEntity.ok().build()
    }
}
