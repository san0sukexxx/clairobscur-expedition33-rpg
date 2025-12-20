package com.example.demo.controller

import com.example.demo.dto.ApplyDefenseRequest
import com.example.demo.dto.CreateDefenseRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.*
import com.example.demo.service.BattleService
import com.example.demo.service.BattleTurnService
import com.example.demo.service.DamageService
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
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val attackStatusEffectRepository: AttackStatusEffectRepository,
        private val battleTurnService: BattleTurnService,
        private val damageService: DamageService,
        private val battleService: BattleService
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

        val newHp = damageService.applyDamage(targetBC, body.totalDamage)

        attack.totalDefended = body.totalDamage
        attack.isResolved = true
        attackRepository.save(attack)

        battleLogRepository.save(
                BattleLog(battleId = attack.battleId, eventType = "DAMAGE_DEALT", eventJson = null)
        )

        battleService.consumeShield(targetBC.id!!)
        battleService.removeMarked(targetBC.id!!)

        val damage = body.totalDamage.coerceAtLeast(0)
        if (damage > 0 && newHp > 0) {
            val attackEffects = attackStatusEffectRepository.findByAttackId(attack.id!!)
            val ignore = listOf("free-shot", "jump", "gradient")

            attackEffects.filter { eff -> !ignore.contains(eff.effectType) }.forEach { eff ->
                val allTargetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)

                if (eff.effectType == "Fragile") {
                    val hasBroken = allTargetEffects.any { it.effectType == "Broken" }
                    if (hasBroken) {
                        return@forEach
                    }
                }

                val existing = allTargetEffects.firstOrNull { it.effectType == eff.effectType }

                val nextAmmount = (existing?.ammount ?: 0) + eff.ammount
                val nextTurns = eff.remainingTurns ?: existing?.remainingTurns

                val toSave =
                        existing?.copy(ammount = nextAmmount, remainingTurns = nextTurns)
                                ?: BattleStatusEffect(
                                        battleCharacterId = targetBC.id!!,
                                        effectType = eff.effectType,
                                        ammount = eff.ammount,
                                        remainingTurns = eff.remainingTurns
                                )

                battleStatusEffectRepository.save(toSave)
            }
        }

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/apply-defense/{battleCharacterId}")
    @Transactional
    fun applyDefense(
            @PathVariable battleCharacterId: Int,
            @RequestBody body: ApplyDefenseRequest
    ): ResponseEntity<Void> {

        val defenderBC = battleCharacterRepository.findById(battleCharacterId).orElse(null)

        // Increment charge for defending (if character has charge system)
        if (defenderBC != null && defenderBC.characterType == "player") {
            val currentCharge = defenderBC.chargePoints ?: 0
            val maxCharge = defenderBC.maxChargePoints ?: 0
            if (maxCharge > 0) {
                defenderBC.chargePoints = (currentCharge + 1).coerceAtMost(maxCharge)
                battleCharacterRepository.save(defenderBC)
            }
        }

        val attacks = attackRepository.findByTargetBattleId(battleCharacterId)

        val usedAttacks = attacks.filter { it.allowCounter && !it.isCounterResolved }

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
                val newHp = damageService.applyDamage(attackerBC, damage)
                if (newHp == 0) {
                    shouldEndTurn = true
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
