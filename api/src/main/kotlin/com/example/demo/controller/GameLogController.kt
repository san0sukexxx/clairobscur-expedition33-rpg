package com.example.demo.controller

import com.example.demo.dto.CreateGameLogRequest
import com.example.demo.dto.GameLogResponse
import com.example.demo.model.GameLog
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.GameLogRepository
import com.example.demo.repository.PlayerRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/game-log")
class GameLogController(
    private val gameLogRepository: GameLogRepository,
    private val campaignPlayerRepository: CampaignPlayerRepository,
    private val playerRepository: PlayerRepository
) {

    @PostMapping("/player/{playerId}")
    fun create(
        @PathVariable playerId: Int,
        @RequestBody req: CreateGameLogRequest
    ): ResponseEntity<GameLogResponse> {
        val campaignPlayer = campaignPlayerRepository.findByPlayerId(playerId)
            ?: return ResponseEntity.badRequest().build()

        val player = playerRepository.findById(playerId).orElse(null)
            ?: return ResponseEntity.badRequest().build()

        val campaignId = campaignPlayer.campaignId

        val log = GameLog(
            campaignId = campaignId,
            playerId = playerId,
            rollType = req.rollType,
            abilityKey = req.abilityKey,
            skillId = req.skillId,
            senseKey = req.senseKey,
            diceRolled = req.diceRolled,
            modifier = req.modifier,
            total = req.total,
            diceCommand = req.diceCommand,
            createdAt = java.time.Instant.now().toString()
        )
        val saved = gameLogRepository.save(log)

        // Prune to max 50 entries per campaign
        val allEntries = gameLogRepository.findAllByCampaignIdOrderByCreatedAtAsc(campaignId)
        if (allEntries.size > 50) {
            val toDelete = allEntries.take(allEntries.size - 50)
            gameLogRepository.deleteAll(toDelete)
        }

        return ResponseEntity.ok(
            GameLogResponse(
                id = saved.id!!,
                playerId = playerId,
                playerName = player.name,
                characterId = player.characterId,
                rollType = saved.rollType,
                abilityKey = saved.abilityKey,
                skillId = saved.skillId,
                senseKey = saved.senseKey,
                diceRolled = saved.diceRolled,
                modifier = saved.modifier,
                total = saved.total,
                diceCommand = saved.diceCommand,
                createdAt = saved.createdAt
            )
        )
    }

    @GetMapping("/player/{playerId}")
    fun listForPlayer(@PathVariable playerId: Int): ResponseEntity<List<GameLogResponse>> {
        val campaignPlayer = campaignPlayerRepository.findByPlayerId(playerId)
            ?: return ResponseEntity.ok(emptyList())

        val campaignId = campaignPlayer.campaignId
        val entries = gameLogRepository.findAllByCampaignIdOrderByCreatedAtDesc(campaignId)

        val campaignPlayers = campaignPlayerRepository.findAllByCampaignId(campaignId)
        val playerIds = campaignPlayers.map { it.playerId }.toSet()
        val players = playerRepository.findAllById(playerIds).associateBy { it.id }

        val responses = entries.map { entry ->
            val p = players[entry.playerId]
            GameLogResponse(
                id = entry.id!!,
                playerId = entry.playerId,
                playerName = p?.name,
                characterId = p?.characterId,
                rollType = entry.rollType,
                abilityKey = entry.abilityKey,
                skillId = entry.skillId,
                senseKey = entry.senseKey,
                diceRolled = entry.diceRolled,
                modifier = entry.modifier,
                total = entry.total,
                diceCommand = entry.diceCommand,
                createdAt = entry.createdAt
            )
        }

        return ResponseEntity.ok(responses)
    }
}
