package com.example.demo.controller

import com.example.demo.dto.AttackStatusEffectResponse
import com.example.demo.dto.CreateAttackRequest
import com.example.demo.dto.GetAttacksResponse
import com.example.demo.dto.StatusEffectRequest
import com.example.demo.model.Attack
import com.example.demo.model.AttackStatusEffect
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.AttackStatusEffectRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.service.BattleService
import com.example.demo.service.DamageService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attacks")
class AttackController(
        private val attackRepository: AttackRepository,
        private val attackStatusEffectRepository: AttackStatusEffectRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleService: BattleService,
        private val damageService: DamageService
) {

        @PostMapping
        @Transactional
        fun addAttack(@RequestBody body: CreateAttackRequest): ResponseEntity<Void> {

                val sourceBC =
                        battleCharacterRepository.findById(body.sourceBattleId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

                if (sourceBC.characterType == "player") {
                        val exhausted =
                                battleStatusEffectRepository
                                        .findByBattleCharacterIdAndEffectType(
                                                sourceBC.id!!,
                                                "Exhausted"
                                        )
                                        .isNotEmpty()

                        val freeShotCost = if (exhausted) 2 else 1

                        val current = sourceBC.magicPoints ?: 0
                        val max = sourceBC.maxMagicPoints ?: 0

                        val next =
                                when (body.attackType) {
                                        "basic" -> (current + 1).coerceAtMost(max)
                                        "free-shot" -> (current - freeShotCost).coerceAtLeast(0)
                                        "skill" -> {
                                                val cost = body.skillCost ?: 0
                                                (current - cost).coerceAtLeast(0)
                                        }
                                        else -> current
                                }

                        sourceBC.magicPoints = next

                        // Charge system logic
                        if (body.consumesCharge == true) {
                                // Overcharge or other skill that consumes all charges
                                sourceBC.chargePoints = 0
                        } else {
                                // All actions increment charge (+1), including each hit of multi-hit skills
                                val currentCharge = sourceBC.chargePoints ?: 0
                                val maxCharge = sourceBC.maxChargePoints ?: 0
                                if (maxCharge > 0) {
                                        sourceBC.chargePoints = (currentCharge + 1).coerceAtMost(maxCharge)
                                }
                        }

                        battleCharacterRepository.save(sourceBC)
                }

                if (body.totalPower != null) {
                        val attack =
                                attackRepository.save(
                                        Attack(
                                                battleId = sourceBC.battleId,
                                                totalPower = body.totalPower,
                                                targetBattleId = body.targetBattleId,
                                                sourceBattleId = body.sourceBattleId,
                                                isResolved = false
                                        )
                                )

                        body.effects.forEach { eff: StatusEffectRequest ->
                                attackStatusEffectRepository.save(
                                        AttackStatusEffect(
                                                attackId = attack.id!!,
                                                effectType = eff.effectType,
                                                ammount = eff.ammount ?: 0,
                                                remainingTurns = eff.remainingTurns
                                        )
                                )
                        }

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = sourceBC.battleId,
                                        eventType = "ATTACK_PENDING",
                                        eventJson = null
                                )
                        )
                } else if (body.totalDamage != null) {
                        val targetBC =
                                battleCharacterRepository.findById(body.targetBattleId).orElse(null)
                                        ?: return ResponseEntity.badRequest().build()

                        val newHp = damageService.applyDamage(targetBC, body.totalDamage)

                        battleService.consumeShield(targetBC.id!!)
                        battleService.removeMarked(targetBC.id!!)

                        val nonStackableEffects = listOf("Fragile", "Inverted", "Flying", "Dizzy", "Stunned", "Silenced", "Exhausted")

                        if (newHp > 0) {
                                body.effects.forEach { eff ->
                                val allTargetEffects = battleStatusEffectRepository
                                        .findByBattleCharacterId(targetBC.id!!)

                                val existing = allTargetEffects.firstOrNull { it.effectType == eff.effectType }

                                if (eff.effectType == "Fragile") {
                                        val hasBroken = allTargetEffects.any { it.effectType == "Broken" }
                                        if (hasBroken) {
                                                return@forEach
                                        }
                                }

                                if (existing != null && nonStackableEffects.contains(eff.effectType)) {
                                        return@forEach
                                }

                                if (existing != null) {
                                        val nextAmount = (existing.ammount) + (eff.ammount ?: 0)
                                        val nextTurns = eff.remainingTurns ?: existing.remainingTurns
                                        battleStatusEffectRepository.save(
                                                existing.copy(
                                                        ammount = nextAmount,
                                                        remainingTurns = nextTurns
                                                )
                                        )
                                } else {
                                        battleStatusEffectRepository.save(
                                                BattleStatusEffect(
                                                        battleCharacterId = targetBC.id!!,
                                                        effectType = eff.effectType,
                                                        ammount = eff.ammount ?: 0,
                                                        remainingTurns = eff.remainingTurns
                                                )
                                        )
                                }
                                }
                        }

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = targetBC.battleId,
                                        eventType = "DAMAGE_DEALT",
                                        eventJson = null
                                )
                        )

                        if (body.attackType == "free-shot" && newHp > 0) {
                                val effects =
                                        battleStatusEffectRepository.findByBattleCharacterId(
                                                targetBC.id!!
                                        )
                                val existing = effects.firstOrNull { it.effectType == "free-shot" }
                                val next = (existing?.ammount ?: 0) + 1

                                val toSave =
                                        existing?.copy(ammount = next)
                                                ?: BattleStatusEffect(
                                                        battleCharacterId = targetBC.id!!,
                                                        effectType = "free-shot",
                                                        ammount = next
                                                )

                                battleStatusEffectRepository.save(toSave)
                        }
                }

                return ResponseEntity.noContent().build()
        }

        @GetMapping("/pending/{battleId}")
        fun getPendingAttacks(
                @PathVariable battleId: Int
        ): ResponseEntity<List<GetAttacksResponse>> {
                val attacks = attackRepository.findByBattleIdAndIsResolvedFalse(battleId)
                if (attacks.isEmpty()) return ResponseEntity.ok(emptyList())

                val attackIds = attacks.mapNotNull { it.id }
                val allEffects = attackStatusEffectRepository.findByAttackIdIn(attackIds)
                val effectsByAttackId = allEffects.groupBy { it.attackId }

                val response =
                        attacks.map { attack ->
                                val effects = effectsByAttackId[attack.id] ?: emptyList()
                                GetAttacksResponse(
                                        id = attack.id!!,
                                        battleId = attack.battleId,
                                        totalPower = attack.totalPower,
                                        targetBattleId = attack.targetBattleId,
                                        sourceBattleId = attack.sourceBattleId,
                                        isResolved = attack.isResolved,
                                        effects =
                                                effects.map {
                                                        AttackStatusEffectResponse(
                                                                id = it.id!!,
                                                                effectType = it.effectType,
                                                                ammount = it.ammount,
                                                                remainingTurns = it.remainingTurns
                                                        )
                                                }
                                )
                        }

                return ResponseEntity.ok(response)
        }

        @PostMapping("/{battleId}/allow-counter")
        fun allowCounterForAll(@PathVariable battleId: Int): ResponseEntity<Void> {
                val attacks = attackRepository.findByBattleId(battleId)
                attacks.forEach { it.allowCounter = true }
                attackRepository.saveAll(attacks)

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "ALLOW_COUNTER",
                                eventJson = null
                        )
                )

                return ResponseEntity.ok().build()
        }
}
