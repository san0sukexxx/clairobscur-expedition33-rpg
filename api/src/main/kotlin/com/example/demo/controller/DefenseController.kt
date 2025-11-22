package com.example.demo.controller

import com.example.demo.dto.ApplyDefenseRequest
import com.example.demo.dto.CreateDefenseRequest
import com.example.demo.model.BattleLog
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.service.BattleTurnService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/defenses")
class DefenseController(
        private val attackRepository: AttackRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val playerRepository: PlayerRepository,
        private val battleTurnService: BattleTurnService
) {

    @PostMapping
    @Transactional
    fun defendFromAttack(@RequestBody body: CreateDefenseRequest): ResponseEntity<Void> {
        if (body.attackId == null || body.totalDamage == null) {
            return ResponseEntity.badRequest().build()
        }

        val attack =
                attackRepository.findById(body.attackId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        if (attack.isResolved) {
            return ResponseEntity.noContent().build()
        }

        val targetBC =
                battleCharacterRepository.findById(attack.targetBattleId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        val damage = body.totalDamage.coerceAtLeast(0)
        val newHp = (targetBC.healthPoints - damage).coerceAtLeast(0)

        targetBC.healthPoints = newHp

        if (newHp == 0) {
            if (targetBC.magicPoints != null) {
                targetBC.magicPoints = 0
            }

            val turns = battleTurnRepository.findByBattleCharacterId(targetBC.id!!)
            if (turns.isNotEmpty()) {
                battleTurnRepository.deleteAllInBatch(turns)
            }
        }

        battleCharacterRepository.save(targetBC)

        val playerId = targetBC.externalId.toIntOrNull()
        if (playerId != null) {
            val player = playerRepository.findById(playerId).orElse(null)
            if (player != null) {
                player.hpCurrent = targetBC.healthPoints
                if (targetBC.magicPoints != null) {
                    player.mpCurrent = targetBC.magicPoints!!
                }
                playerRepository.save(player)
            }
        }

        attack.totalDefended = body.totalDamage
        attack.isResolved = true
        attackRepository.save(attack)

        battleLogRepository.save(
                BattleLog(battleId = attack.battleId, eventType = "DAMAGE_DEALT", eventJson = null)
        )

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/apply-defense/{battleCharacterId}")
    @Transactional
    fun applyDefense(
            @PathVariable battleCharacterId: Int,
            @RequestBody body: ApplyDefenseRequest
    ): ResponseEntity<Void> {

        val attacks = attackRepository.findByTargetBattleId(battleCharacterId)

        val usedAttacks =
                attacks.filter {
                    it.allowCounter && !it.isCounterResolved
                }

        if (usedAttacks.isEmpty()) {
            return ResponseEntity.noContent().build()
        }

        var shouldEndTurn = false
        var battleId: Int? = null
        var remainingDamage = body.maxDamage

        usedAttacks.forEach { attack ->
            val attackerBC =
                    battleCharacterRepository.findById(attack.sourceBattleId).orElse(null)
                            ?: return@forEach

            if (battleId == null) {
                battleId = attackerBC.battleId
            }

            val rawDamage = kotlin.math.abs(attack.totalDefended ?: 0)

            val damage =
                    if (remainingDamage <= 0) {
                        0
                    } else {
                        val applied = rawDamage.coerceAtMost(remainingDamage)
                        remainingDamage -= applied
                        applied
                    }

            if (damage > 0) {
                val oldHp = attackerBC.healthPoints
                val newHp = (oldHp - damage).coerceAtLeast(0)
                attackerBC.healthPoints = newHp

                if (newHp == 0) {
                    if (attackerBC.magicPoints != null) {
                        attackerBC.magicPoints = 0
                    }

                    val turns = battleTurnRepository.findByBattleCharacterId(attackerBC.id!!)
                    if (turns.isNotEmpty()) {
                        battleTurnRepository.deleteAllInBatch(turns)
                    }

                    shouldEndTurn = true
                }

                battleCharacterRepository.save(attackerBC)

                val playerId = attackerBC.externalId.toIntOrNull()
                if (playerId != null) {
                    val player = playerRepository.findById(playerId).orElse(null)
                    if (player != null) {
                        player.hpCurrent = attackerBC.healthPoints
                        if (attackerBC.magicPoints != null) {
                            player.mpCurrent = attackerBC.magicPoints!!
                        }
                        playerRepository.save(player)
                    }
                }
            }

            attack.isCounterResolved = true
        }

        attackRepository.saveAll(usedAttacks)

        val finalBattleId = battleId

        if (finalBattleId != null) {
            if (shouldEndTurn) {
                val allAttacks = attackRepository.findByBattleId(finalBattleId)
                if (allAttacks.isNotEmpty()) {
                    attackRepository.deleteAll(allAttacks)
                }

                battleTurnService.advanceTurn(finalBattleId)

                battleLogRepository.save(
                        BattleLog(
                                battleId = finalBattleId,
                                eventType = "TURN_ENDED",
                                eventJson = null
                        )
                )
            }

            battleLogRepository.save(
                    BattleLog(
                            battleId = finalBattleId,
                            eventType = "COUNTER_RESOLVED",
                            eventJson = null
                    )
            )
        }

        return ResponseEntity.ok().build()
    }
}
