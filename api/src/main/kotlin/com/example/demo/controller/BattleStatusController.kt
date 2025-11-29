package com.example.demo.controller

import com.example.demo.dto.AddStatusRequest
import com.example.demo.dto.ApplyStatusRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.service.BattleTurnService
import com.example.demo.service.DamageService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle-status")
class BattleStatusController(
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val playerRepository: PlayerRepository,
        private val battleTurnService: BattleTurnService,
        private val damageService: DamageService
) {

    @PostMapping("/resolve")
    @Transactional
    fun applyStatusEffect(@RequestBody body: ApplyStatusRequest): ResponseEntity<Void> {
        val effects =
                battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                        body.battleCharacterId,
                        body.effectType
                )

        if (effects.isEmpty()) {
            return ResponseEntity.noContent().build()
        }

        val battleCharacter =
                battleCharacterRepository.findById(body.battleCharacterId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        val battleId = battleCharacter.battleId ?: return ResponseEntity.badRequest().build()

        if (body.effectType == "Frozen") {
            var remainingToSpend = body.totalValue

            effects.forEach { eff ->
                if (remainingToSpend <= 0) return@forEach

                val current = eff.ammount
                val next = current - remainingToSpend

                if (next <= 0) {
                    remainingToSpend -= current
                    battleStatusEffectRepository.delete(eff)
                } else {
                    battleStatusEffectRepository.save(eff.copy(ammount = next))
                    remainingToSpend = 0
                }
            }
        } else if (body.effectType == "Burning") {
            val damage = body.totalValue

            if (damage > 0) {
                val newHp = damageService.applyDamage(battleCharacter, damage)

                if (newHp > 0) {
                    effects.forEach { eff ->
                        val remaining = (eff.remainingTurns ?: 0) - 1
                        if (remaining <= 0) {
                            battleStatusEffectRepository.delete(eff)
                        } else {
                            battleStatusEffectRepository.save(eff.copy(remainingTurns = remaining))
                        }
                    }
                }
            }
        } else if (body.effectType == "Regeneration") {
            val heal = body.totalValue.coerceAtLeast(0)

            if (heal > 0) {
                val invertedEffects =
                        battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                                battleCharacter.id!!,
                                "Inverted"
                        )

                val hasInverted = invertedEffects.isNotEmpty()

                if (hasInverted) {
                    damageService.applyDamage(battleCharacter, heal)
                } else {
                    val currentHp = battleCharacter.healthPoints
                    val maxHp = battleCharacter.maxHealthPoints ?: currentHp
                    val nextHp = (currentHp + heal).coerceAtMost(maxHp)

                    battleCharacter.healthPoints = nextHp
                    battleCharacterRepository.save(battleCharacter)
                }
            }

            effects.forEach { eff ->
                val remaining = (eff.remainingTurns ?: 0) - 1

                if (remaining <= 0) {
                    battleStatusEffectRepository.delete(eff)
                } else {
                    battleStatusEffectRepository.save(eff.copy(remainingTurns = remaining))
                }
            }
        } else if (body.effectType == "Cursed") {
            effects.forEach { eff ->
                val remaining = (eff.remainingTurns ?: 0) - 1

                if (remaining <= 0) {
                    val currentHp = battleCharacter.healthPoints

                    if (currentHp > 0) {
                        damageService.applyDamage(battleCharacter, currentHp)
                    }
                } else {
                    battleStatusEffectRepository.save(eff.copy(remainingTurns = remaining))
                }
            }
        } else if (body.effectType == "Confused") {
            effects.forEach { eff ->
                val effectValue = eff.ammount
                if (effectValue != null && body.totalValue > effectValue) {
                    battleStatusEffectRepository.delete(eff)
                }
            }
        }

        effects.forEach { eff ->
            val id = eff.id
            if (id != null && battleStatusEffectRepository.existsById(id)) {
                battleStatusEffectRepository.save(eff.copy(isResolved = true))
            }
        }

        battleLogRepository.save(BattleLog(battleId = battleId, eventType = "STATUS_RESOLVED"))

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/add")
    @Transactional
    fun addStatus(@RequestBody body: AddStatusRequest): ResponseEntity<Void> {
        val bc =
                battleCharacterRepository.findById(body.battleCharacterId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        if (body.effectType == "Plagued") {
            val amount = body.ammount ?: 0
            if (amount > 0) {
                val currentMax = bc.maxHealthPoints ?: bc.healthPoints
                val reduction = 5 * amount
                val nextMax = (currentMax - reduction).coerceAtLeast(1)
                bc.maxHealthPoints = nextMax

                if (bc.healthPoints > nextMax) {
                    bc.healthPoints = nextMax
                }

                if (bc.characterType == "player") {
                    val playerId = bc.externalId.toIntOrNull()
                    if (playerId != null) {
                        val player = playerRepository.findById(playerId).orElse(null)
                        if (player != null) {
                            player.hpCurrent = bc.healthPoints
                            playerRepository.save(player)
                        }
                    }
                }

                battleCharacterRepository.save(bc)
            }
        }

        val existing =
                battleStatusEffectRepository.findByBattleCharacterId(bc.id!!).firstOrNull {
                    it.effectType == body.effectType
                }

        val toSave =
                if (existing != null) {
                    val nextAmount = (existing.ammount ?: 0) + body.ammount
                    val nextTurns = body.remainingTurns ?: existing.remainingTurns
                    existing.copy(ammount = nextAmount, remainingTurns = nextTurns)
                } else {
                    BattleStatusEffect(
                            battleCharacterId = bc.id!!,
                            effectType = body.effectType,
                            ammount = body.ammount,
                            remainingTurns = body.remainingTurns
                    )
                }

        battleStatusEffectRepository.save(toSave)

        val oppositeTypes = getOppositeStatusTypes(body.effectType)
        if (oppositeTypes.isNotEmpty()) {
            val allEffects = battleStatusEffectRepository.findByBattleCharacterId(bc.id!!)
            val toDelete = allEffects.filter { it.effectType in oppositeTypes }
            if (toDelete.isNotEmpty()) {
                battleStatusEffectRepository.deleteAll(toDelete)
            }
        }

        battleLogRepository.save(BattleLog(battleId = battleId, eventType = "STATUS_ADDED"))

        return ResponseEntity.noContent().build()
    }

    private fun getOppositeStatusTypes(effectType: String): List<String> =
            when (effectType) {
                "Hastened" -> listOf("Slowed")
                "Slowed" -> listOf("Hastened")
                "Weakened" -> listOf("Empowered")
                "Empowered" -> listOf("Weakened")
                "Protected" -> listOf("Unprotected")
                "Unprotected" -> listOf("Protected")
                else -> emptyList()
            }
}
