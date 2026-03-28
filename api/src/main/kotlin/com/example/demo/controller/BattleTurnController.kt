package com.example.demo.controller

import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.CreateBattleTurnRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.service.BattleCharacterService
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
        private val battleCharacterService: BattleCharacterService
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

                battleTurnService.advanceTurn(battleId)

                // Grant +1 MP to the next player whose turn is starting
                val nextTurn = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId).firstOrNull()
                if (nextTurn != null) {
                        val nextChar = battleCharacterRepository.findById(nextTurn.battleCharacterId).orElse(null)
                        if (nextChar != null && nextChar.characterType.equals("player", ignoreCase = true)) {
                                battleCharacterService.updateCharacterAP(nextTurn.battleCharacterId, 1)
                        }
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

        @PostMapping("/{battleCharacterId}/grant-extra")
        @Transactional
        fun grantExtraTurn(
                @PathVariable battleCharacterId: Int
        ): ResponseEntity<Void> {
                val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

                val battleId = bc.battleId

                battleTurnService.grantExtraTurn(battleId, battleCharacterId)

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "EXTRA_TURN_GRANTED", eventJson = null)
                )

                return ResponseEntity.noContent().build()
        }

        @PutMapping("/reorder")
        @Transactional
        fun reorderTurns(@RequestBody body: ReorderTurnsRequest): ResponseEntity<Void> {
                // Remember who was first before reordering
                val previousFirstTurnId = body.turns.firstOrNull()?.let { firstNewId ->
                        val turn = battleTurnRepository.findById(firstNewId).orElse(null)
                        if (turn != null) {
                                val allTurns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(turn.battleId)
                                allTurns.firstOrNull()?.battleCharacterId
                        } else null
                }

                body.turns.forEachIndexed { index, turnId ->
                        val turn = battleTurnRepository.findById(turnId).orElse(null)
                        if (turn != null) {
                                turn.playOrder = index + 1
                                battleTurnRepository.save(turn)
                        }
                }

                // Grant +1 AP if a different player moved to first position
                if (body.turns.isNotEmpty()) {
                        val newFirstTurn = battleTurnRepository.findById(body.turns.first()).orElse(null)
                        if (newFirstTurn != null) {
                                val newFirstCharId = newFirstTurn.battleCharacterId
                                if (newFirstCharId != previousFirstTurnId) {
                                        val nextChar = battleCharacterRepository.findById(newFirstCharId).orElse(null)
                                        if (nextChar != null && nextChar.characterType.equals("player", ignoreCase = true)) {
                                                battleCharacterService.updateCharacterAP(newFirstCharId, 1)
                                        }
                                }

                                battleLogRepository.save(
                                        BattleLog(battleId = newFirstTurn.battleId, eventType = "TURNS_REORDERED", eventJson = null)
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
