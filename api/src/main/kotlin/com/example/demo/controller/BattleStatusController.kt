package com.example.demo.controller

import com.example.demo.dto.AddStatusRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle-status")
class BattleStatusController(
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val objectMapper: ObjectMapper
) {

    @PostMapping("/add")
    @Transactional
    fun addStatus(@RequestBody body: AddStatusRequest): ResponseEntity<Void> {
        val bc =
                battleCharacterRepository.findById(body.battleCharacterId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        // Reject meta effects that are not actual battle statuses
        val metaEffects = listOf("Heal", "Cleanse", "jump", "gradient")
        if (body.effectType in metaEffects) {
            println("[BattleStatusController] Rejected meta effect type: ${body.effectType}")
            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId

        val existing = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(bc.id!!, body.effectType)
                .firstOrNull()

        val toSave =
                if (existing != null) {
                    val nextAmount = (existing.ammount) + body.ammount
                    val nextTurns = body.remainingTurns ?: existing.remainingTurns
                    val sourceId = existing.sourceCharacterId ?: body.sourceCharacterId
                    existing.copy(ammount = nextAmount, remainingTurns = nextTurns, sourceCharacterId = sourceId)
                } else {
                    BattleStatusEffect(
                            battleCharacterId = bc.id!!,
                            effectType = body.effectType,
                            ammount = body.ammount,
                            remainingTurns = body.remainingTurns,
                            sourceCharacterId = body.sourceCharacterId
                    )
                }

        battleStatusEffectRepository.save(toSave)

        battleLogRepository.save(BattleLog(battleId = battleId, eventType = "STATUS_ADDED"))

        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{battleCharacterId}/status/{effectType}")
    @Transactional
    fun removeSpecificStatus(
        @PathVariable battleCharacterId: Int,
        @PathVariable effectType: String
    ): ResponseEntity<Void> {
        val effects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(battleCharacterId, effectType)

        if (effects.isNotEmpty()) {
            battleStatusEffectRepository.deleteAll(effects)
        }

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/heal/{battleCharacterId}")
    @Transactional
    fun healCharacter(
            @PathVariable battleCharacterId: Int,
            @RequestBody body: HealRequest
    ): ResponseEntity<Void> {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId

        val maxHp = bc.maxHealthPoints
        val healAmount = body.amount
        val oldHp = bc.healthPoints
        val newHp = (bc.healthPoints + healAmount).coerceAtMost(maxHp)
        val actualHealed = newHp - oldHp

        bc.healthPoints = newHp
        battleCharacterRepository.save(bc)

        val eventJson = objectMapper.writeValueAsString(
                mapOf(
                        "battleCharacterId" to battleCharacterId,
                        "characterName" to bc.characterName,
                        "healAmount" to actualHealed,
                        "oldHp" to oldHp,
                        "newHp" to newHp
                )
        )

        battleLogRepository.save(
                BattleLog(battleId = battleId, eventType = "HEAL_APPLIED", eventJson = eventJson)
        )

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/consume-foretell/{battleCharacterId}")
    @Transactional
    fun consumeOneForetell(@PathVariable battleCharacterId: Int): ResponseEntity<Boolean> {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.ok(false)
        }

        val battleId = bc.battleId

        // Find Foretell status and consume 1 stack
        val foretellStatus = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(battleCharacterId, "Foretell")
                .firstOrNull()

        if (foretellStatus == null || (foretellStatus.ammount) <= 0) {
            return ResponseEntity.ok(false)  // No Foretell to consume
        }

        val newAmount = (foretellStatus.ammount) - 1
        if (newAmount <= 0) {
            // Remove status entirely
            battleStatusEffectRepository.delete(foretellStatus)
        } else {
            // Decrease by 1
            battleStatusEffectRepository.save(foretellStatus.copy(ammount = newAmount))
        }

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "FORETELL_CONSUMED",
                        eventJson = null
                )
        )

        return ResponseEntity.ok(true)  // Successfully consumed 1 Foretell
    }

    @PostMapping("/extend-duration/{battleCharacterId}")
    @Transactional
    fun extendStatusDuration(
            @PathVariable battleCharacterId: Int,
            @RequestBody body: ExtendDurationRequest
    ): ResponseEntity<Void> {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId

        // Find the status effect and extend its duration
        val effects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                battleCharacterId,
                body.effectType
        )

        effects.forEach { effect ->
            val currentTurns = effect.remainingTurns ?: 0
            val newTurns = currentTurns + body.additionalTurns
            battleStatusEffectRepository.save(
                    effect.copy(remainingTurns = newTurns)
            )
        }

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "STATUS_EXTENDED",
                        eventJson = null
                )
        )

        return ResponseEntity.noContent().build()
    }
}

data class HealRequest(val amount: Int)
data class ExtendDurationRequest(val effectType: String, val additionalTurns: Int)
