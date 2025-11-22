package com.example.demo.controller

import com.example.demo.dto.AttackStatusEffectResponse
import com.example.demo.dto.CreateAttackRequest
import com.example.demo.dto.GetAttacksResponse
import com.example.demo.dto.StatusEffectRequest
import com.example.demo.model.Attack
import com.example.demo.model.AttackStatusEffect
import com.example.demo.model.BattleLog
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.AttackStatusEffectRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
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
        private val battleTurnRepository: BattleTurnRepository
) {

        @PostMapping
        @Transactional
        fun addAttack(@RequestBody body: CreateAttackRequest): ResponseEntity<Void> {

                val sourceBC =
                        battleCharacterRepository.findById(body.sourceBattleId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

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
                                                ammount = eff.ammount ?: 0
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

                        val newHp = (targetBC.healthPoints - body.totalDamage).coerceAtLeast(0)

                        targetBC.healthPoints = newHp
                        battleCharacterRepository.save(targetBC)

                        if (newHp == 0) {
                                val turns =
                                        battleTurnRepository.findByBattleCharacterId(targetBC.id!!)
                                if (turns.isNotEmpty()) {
                                        battleTurnRepository.deleteAllInBatch(turns)
                                }
                        }

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = targetBC.battleId,
                                        eventType = "DAMAGE_DEALT",
                                        eventJson = null
                                )
                        )
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
                                                                ammount = it.ammount
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
