package com.example.demo.controller

import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.CreateBattleTurnRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
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
        private val attackRepository: AttackRepository
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

                battleTurnService.advanceTurn(battleId)

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "TURN_ENDED", eventJson = null)
                )

                return ResponseEntity.noContent().build()
        }
}

private fun BattleTurn.toResponse() =
        BattleTurnResponse(
                id = this.id ?: 0,
                battleId = this.battleId,
                battleCharacterId = this.battleCharacterId,
                playOrder = this.playOrder
        )
