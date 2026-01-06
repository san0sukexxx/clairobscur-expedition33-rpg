package com.example.demo.controller

import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.CreateBattleTurnRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.service.BattleTurnService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle-turns")
class BattleTurnController(
        private val battleTurnRepository: BattleTurnRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnService: BattleTurnService,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val attackRepository: AttackRepository,
        private val damageService: com.example.demo.service.DamageService,
        private val playerRepository: com.example.demo.repository.PlayerRepository
) {

        @PostMapping
        @Transactional
        fun create(@RequestBody body: CreateBattleTurnRequest): ResponseEntity<BattleTurnResponse> {
                val bc =
                        battleCharacterRepository.findById(body.battleCharacterId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

                val battleId = bc.battleId

                bc.canRollInitiative = false
                battleCharacterRepository.save(bc)

                val last = battleTurnRepository.findTopByBattleIdOrderByPlayOrderDesc(battleId)
                val nextPlayOrder = (last?.playOrder ?: 0) + 1

                val saved =
                        battleTurnRepository.save(
                                BattleTurn(
                                        battleId = battleId,
                                        battleCharacterId = body.battleCharacterId,
                                        playOrder = nextPlayOrder
                                )
                        )

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "TURN_ADDED", eventJson = null)
                )

                return ResponseEntity.ok(saved.toResponse())
        }

        @PostMapping("/{playerBattleId}/end")
        @Transactional
        fun endTurn(@PathVariable playerBattleId: Int): ResponseEntity<Void> {
                val bc =
                        battleCharacterRepository.findById(playerBattleId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

                val battleId = bc.battleId

                val attacks = attackRepository.findByBattleId(battleId)
                if (attacks.isNotEmpty()) {
                        attackRepository.deleteAll(attacks)
                }

                val ignoreRemainingTurns = listOf("Burning", "Frozen", "Regeneration", "Cursed", "Fleeing", "Foretell")

                val statusList = battleStatusEffectRepository.findByBattleCharacterId(bc.id!!)
                statusList.forEach { eff ->
                        if (eff.skipNextDecrement) {
                                battleStatusEffectRepository.save(
                                        eff.copy(
                                                skipNextDecrement = false,
                                                isResolved = if (eff.isResolved) false else eff.isResolved
                                        )
                                )
                                return@forEach
                        }

                        val shouldIgnore = ignoreRemainingTurns.contains(eff.effectType)

                        if (!shouldIgnore) {
                                val current = eff.remainingTurns

                                if (current != null) {
                                        val next = current - 1
                                        if (next <= 0) {
                                                battleStatusEffectRepository.delete(eff)
                                                return@forEach
                                        } else {
                                                battleStatusEffectRepository.save(
                                                        eff.copy(
                                                                remainingTurns = next,
                                                                isResolved = false
                                                        )
                                                )
                                                return@forEach
                                        }
                                }
                        }

                        if (eff.isResolved) {
                                battleStatusEffectRepository.save(eff.copy(isResolved = false))
                        }
                }

                battleTurnService.advanceTurn(battleId)

                // Regenerate 1 MP for the next character at the start of their turn
                val nextTurn = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId).firstOrNull()
                if (nextTurn != null) {
                        val nextCharacter = battleCharacterRepository.findById(nextTurn.battleCharacterId).orElse(null)
                        if (nextCharacter != null && nextCharacter.characterType == "player") {
                                val currentMp = nextCharacter.magicPoints ?: 0
                                val maxMp = nextCharacter.maxMagicPoints ?: 0
                                if (maxMp > 0 && currentMp < maxMp) {
                                        nextCharacter.magicPoints = (currentMp + 1).coerceAtMost(maxMp)
                                        battleCharacterRepository.save(nextCharacter)
                                }

                                // Check for Clea's Life picto - heal to 100% if no damage taken last turn
                                damageService.checkCleasLife(battleId, nextCharacter)
                        }
                }

                // Maelle stance reset mechanic: If Maelle didn't use a stance-changing/maintaining skill,
                // reset her stance to null (Stanceless) at end of turn
                if (bc.characterType == "player" && !bc.stanceChangedThisTurn && bc.stance != null) {
                        val playerId = bc.externalId.toIntOrNull()
                        if (playerId != null) {
                                val player = playerRepository.findById(playerId).orElse(null)
                                if (player != null && player.characterId?.lowercase() == "maelle") {
                                        bc.stance = null
                                        battleCharacterRepository.save(bc)
                                }
                        }
                }

                // Reset stance flag for next turn
                if (bc.stanceChangedThisTurn) {
                        bc.stanceChangedThisTurn = false
                        battleCharacterRepository.save(bc)
                }

                // Reset parries counter at end of turn (for Payback skill)
                if (bc.parriesThisTurn > 0) {
                        bc.parriesThisTurn = 0
                        battleCharacterRepository.save(bc)
                }

                // Reset hits taken counter at end of turn (for Revenge skill)
                if (bc.hitsTakenThisTurn > 0) {
                        bc.hitsTakenThisTurn = 0
                        battleCharacterRepository.save(bc)
                }

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "TURN_ENDED", eventJson = null)
                )

                return ResponseEntity.noContent().build()
        }

        @PostMapping("/{battleCharacterId}/delay")
        @Transactional
        fun delayTurn(
                @PathVariable battleCharacterId: Int,
                @RequestBody body: DelayTurnRequest
        ): ResponseEntity<Void> {
                val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

                val battleId = bc.battleId

                battleTurnService.delayTurn(battleId, battleCharacterId, body.delayAmount)

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "TURN_DELAYED", eventJson = null)
                )

                return ResponseEntity.noContent().build()
        }

        @PutMapping("/reorder")
        @Transactional
        fun reorderTurns(@RequestBody body: ReorderTurnsRequest): ResponseEntity<Void> {
                body.turns.forEachIndexed { index, turnId ->
                        val turn = battleTurnRepository.findById(turnId).orElse(null)
                        if (turn != null) {
                                turn.playOrder = index + 1
                                battleTurnRepository.save(turn)
                        }
                }

                if (body.turns.isNotEmpty()) {
                        val firstTurn = battleTurnRepository.findById(body.turns.first()).orElse(null)
                        if (firstTurn != null) {
                                battleLogRepository.save(
                                        BattleLog(battleId = firstTurn.battleId, eventType = "TURNS_REORDERED", eventJson = null)
                                )
                        }
                }

                return ResponseEntity.noContent().build()
        }
}

data class DelayTurnRequest(val delayAmount: Int)
data class ReorderTurnsRequest(val turns: List<Int>)

private fun BattleTurn.toResponse() =
        BattleTurnResponse(
                id = this.id ?: 0,
                battleId = this.battleId,
                battleCharacterId = this.battleCharacterId,
                playOrder = this.playOrder
        )
