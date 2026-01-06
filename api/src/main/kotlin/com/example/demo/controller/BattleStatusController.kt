package com.example.demo.controller

import com.example.demo.dto.AddStatusRequest
import com.example.demo.dto.ApplyStatusRequest
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.service.BattleTurnService
import com.example.demo.service.DamageService
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
        private val battleRepository: BattleRepository,
        private val playerRepository: PlayerRepository,
        private val battleTurnService: BattleTurnService,
        private val damageService: DamageService,
        private val battleTurnRepository: BattleTurnRepository,
        private val objectMapper: ObjectMapper,
        private val immunityService: com.example.demo.service.ImmunityService,
        private val pictoEffectTrackerService: com.example.demo.service.PictoEffectTrackerService,
        private val playerPictoRepository: com.example.demo.repository.PlayerPictoRepository
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
            val baseHeal = body.totalValue.coerceAtLeast(0)

            if (baseHeal > 0) {
                // Check if character has Confident picto - blocks ALL healing
                if (hasConfidentPicto(battleCharacter)) {
                    // Cannot be healed - log and skip healing
                    val eventJson = objectMapper.writeValueAsString(
                            mapOf(
                                    "battleCharacterId" to battleCharacter.id!!,
                                    "characterName" to battleCharacter.characterName,
                                    "healingBlocked" to baseHeal,
                                    "healingType" to "regeneration",
                                    "reason" to "confident_picto"
                            )
                    )

                    battleLogRepository.save(
                            BattleLog(
                                    battleId = battleId,
                                    eventType = "HEALING_BLOCKED",
                                    eventJson = eventJson
                            )
                    )
                } else {
                    // Apply Effective Heal modifier (doubles healing if equipped)
                    val heal = damageService.applyEffectiveHeal(battleCharacter, baseHeal)

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

                        // Apply Healing Share: distribute 15% of heal to characters with healing-share picto
                        damageService.applyHealingShare(battleId, battleCharacter, heal)
                    }
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
        } else if (body.effectType == "Fleeing") {
            effects.forEach { eff ->
                val currentRemainingTurns = eff.remainingTurns
                if (currentRemainingTurns != null) {
                    val remaining = currentRemainingTurns - 1

                    if (remaining <= 0) {
                        val allCharacters = battleCharacterRepository.findByBattleId(battleId)
                        val teamMembers = allCharacters.filter { it.isEnemy == battleCharacter.isEnemy }

                        teamMembers.forEach { member ->
                            val memberEffects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                                    member.id!!,
                                    "Fleeing"
                            )
                            memberEffects.forEach { memberEff ->
                                battleStatusEffectRepository.delete(memberEff)
                            }
                            battleCharacterRepository.delete(member)
                        }

                        val battle = battleRepository.findById(battleId).orElse(null)
                        if (battle != null) {
                            val updatedBattle = battle.copy(battleStatus = "finished")
                            battleRepository.save(updatedBattle)
                            battleLogRepository.save(
                                    BattleLog(battleId = battleId, eventType = "BATTLE_FINISHED", eventJson = null)
                            )
                        }
                    } else {
                        battleStatusEffectRepository.save(eff.copy(remainingTurns = remaining))
                    }
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

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        // Check if character is immune to this status
        if (!immunityService.canApplyStatus(bc.id!!, body.effectType)) {
            // Character is immune or resisted the status, log it and return
            val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to bc.id!!,
                            "characterName" to bc.characterName,
                            "statusType" to body.effectType,
                            "result" to "immune_or_resisted"
                    )
            )

            battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "STATUS_IMMUNE", eventJson = eventJson)
            )

            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        // Check for Energising Cleanse picto - intercept first negative status
        if (handleEnergisingCleanse(battleId, bc, body.effectType)) {
            // Status was cleansed and MP was granted, return without applying the status
            return ResponseEntity.noContent().build()
        }

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

        val allEffects = battleStatusEffectRepository.findByBattleCharacterId(bc.id!!)

        val existing = allEffects.firstOrNull { it.effectType == body.effectType }

        if (body.effectType == "Fragile") {
            val hasBroken = allEffects.any { it.effectType == "Broken" }
            if (hasBroken) {
                return ResponseEntity.noContent().build()
            }
        }

        val nonStackableEffects = listOf("Fragile", "Flying")

        if (existing != null && nonStackableEffects.contains(body.effectType)) {
            return ResponseEntity.noContent().build()
        }

        val shouldBeResolved = isPassiveEffect(body.effectType)

        val turns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId)
        val currentTurn = turns.firstOrNull()
        val isReceivingOwnStatus = currentTurn?.battleCharacterId == bc.id
        val shouldSkipNextDecrement = isReceivingOwnStatus

        val toSave =
                if (existing != null) {
                    val nextAmount = (existing.ammount ?: 0) + body.ammount
                    val nextTurns = body.remainingTurns ?: existing.remainingTurns
                    existing.copy(ammount = nextAmount, remainingTurns = nextTurns, isResolved = shouldBeResolved, skipNextDecrement = shouldSkipNextDecrement)
                } else {
                    BattleStatusEffect(
                            battleCharacterId = bc.id!!,
                            effectType = body.effectType,
                            ammount = body.ammount,
                            remainingTurns = body.remainingTurns,
                            isResolved = shouldBeResolved,
                            skipNextDecrement = shouldSkipNextDecrement
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

    private fun isPassiveEffect(effectType: String): Boolean =
            when (effectType) {
                "Empowered", "Weakened", "Hastened", "Slowed",
                "Protected", "Unprotected", "Shield", "Marked",
                "Dizzy", "Exhausted", "Silenced", "Stunned",
                "Fragile", "Inverted", "Flying", "Plagued", "Broken" -> true

                "Burning", "Frozen", "Regeneration", "Cursed",
                "Confused", "Bleeding", "Poisoned", "Fleeing" -> false

                else -> false
            }

    private fun isNegativeEffect(effectType: String): Boolean =
            when (effectType) {
                "Burning", "Frozen", "Cursed", "Confused", "Bleeding", "Poisoned",
                "Fleeing", "Weakened", "Slowed", "Unprotected", "Dizzy", "Exhausted",
                "Silenced", "Stunned", "Fragile", "Inverted", "Plagued", "Marked", "Broken" -> true

                "Empowered", "Hastened", "Protected", "Shield", "Regeneration", "Flying" -> false

                else -> false
            }

    /**
     * Checks if character has "Energising Cleanse" picto equipped and can activate it.
     * If yes, prevents the status effect and grants 2 MP instead.
     * Returns true if the status was intercepted (cleansed), false otherwise.
     */
    private fun handleEnergisingCleanse(
            battleId: Int,
            battleCharacter: com.example.demo.model.BattleCharacter,
            effectType: String
    ): Boolean {
        // Only intercept negative status effects
        if (!isNegativeEffect(effectType)) {
            return false
        }

        // Only works for player characters
        if (battleCharacter.characterType != "player") {
            return false
        }

        // Check if player has Energising Cleanse picto equipped (slots 0-2)
        val playerId = battleCharacter.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasEnergisingCleanse = pictos.any {
            it.pictoId.lowercase() == "energising-cleanse" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasEnergisingCleanse) {
            return false
        }

        // Check if effect can be activated (once-per-battle)
        val canActivate = pictoEffectTrackerService.canActivate(
                battleId,
                battleCharacter.id!!,
                "Energising Cleanse",
                "once-per-battle"
        )

        if (!canActivate) {
            return false
        }

        // Activate the effect: grant 2 MP
        val currentMp = battleCharacter.magicPoints ?: 0
        val maxMp = battleCharacter.maxMagicPoints ?: 0
        val newMp = (currentMp + 2).coerceAtMost(maxMp)

        battleCharacter.magicPoints = newMp
        battleCharacterRepository.save(battleCharacter)

        // Update player MP if necessary
        val player = playerRepository.findById(playerId).orElse(null)
        if (player != null) {
            player.mpCurrent = newMp
            playerRepository.save(player)
        }

        // Track that the effect was used
        pictoEffectTrackerService.track(
                battleId,
                battleCharacter.id!!,
                "Energising Cleanse",
                "once-per-battle"
        )

        // Log the event
        val eventJson = objectMapper.writeValueAsString(
                mapOf(
                        "battleCharacterId" to battleCharacter.id!!,
                        "characterName" to battleCharacter.characterName,
                        "statusType" to effectType,
                        "mpGained" to 2,
                        "newMp" to newMp,
                        "result" to "cleansed"
                )
        )

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "ENERGISING_CLEANSE",
                        eventJson = eventJson
                )
        )

        return true
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

    @PostMapping("/cleanse/{battleCharacterId}")
    @Transactional
    fun cleanseNegativeEffects(@PathVariable battleCharacterId: Int): ResponseEntity<Void> {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        val allEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
        val negativeEffects = allEffects.filter { isNegativeEffect(it.effectType) }

        if (negativeEffects.isNotEmpty()) {
            val removedEffects = negativeEffects.map { it.effectType }
            battleStatusEffectRepository.deleteAll(negativeEffects)

            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to battleCharacterId,
                            "characterName" to bc.characterName,
                            "removedEffects" to removedEffects,
                            "count" to negativeEffects.size
                    )
            )

            battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "STATUS_CLEANSED", eventJson = eventJson)
            )
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

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        val maxHp = bc.maxHealthPoints ?: bc.healthPoints
        val healAmount = body.amount
        val oldHp = bc.healthPoints
        val newHp = (bc.healthPoints + healAmount).coerceAtMost(maxHp)
        val actualHealed = newHp - oldHp

        bc.healthPoints = newHp
        battleCharacterRepository.save(bc)

        if (bc.characterType == "player") {
            val playerId = bc.externalId.toIntOrNull()
            if (playerId != null) {
                val player = playerRepository.findById(playerId).orElse(null)
                if (player != null) {
                    player.hpCurrent = newHp
                    playerRepository.save(player)
                }
            }
        }

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

    @PostMapping("/break/{battleCharacterId}")
    @Transactional
    fun breakCharacter(@PathVariable battleCharacterId: Int): ResponseEntity<Void> {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                ?: return ResponseEntity.badRequest().build()

        if (bc.healthPoints <= 0) {
            return ResponseEntity.noContent().build()
        }

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        val allEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
        val fragileEffect = allEffects.firstOrNull { it.effectType == "Fragile" }

        if (fragileEffect != null) {
            battleStatusEffectRepository.delete(fragileEffect)

            battleStatusEffectRepository.save(
                    BattleStatusEffect(
                            battleCharacterId = battleCharacterId,
                            effectType = "Broken",
                            ammount = 0,
                            remainingTurns = 1
                    )
            )

            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to battleCharacterId,
                            "characterName" to bc.characterName,
                            "broken" to true
                    )
            )

            battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "BREAK_APPLIED", eventJson = eventJson)
            )
        }

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

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

        // Find Foretell status and consume 1 stack
        val foretellStatus = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(battleCharacterId, "Foretell")
                .firstOrNull()

        if (foretellStatus == null || (foretellStatus.ammount ?: 0) <= 0) {
            return ResponseEntity.ok(false)  // No Foretell to consume
        }

        val newAmount = (foretellStatus.ammount ?: 0) - 1
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

        val battleId = bc.battleId ?: return ResponseEntity.badRequest().build()

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

    /**
     * Checks if character has "Confident" picto equipped.
     * Returns true if the picto is equipped in slots 0-2.
     */
    private fun hasConfidentPicto(battleCharacter: com.example.demo.model.BattleCharacter): Boolean {
        if (battleCharacter.characterType != "player") {
            return false
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        return pictos.any {
            it.pictoId.lowercase() == "confident" &&
            it.slot != null &&
            it.slot in 0..2
        }
    }
}

data class HealRequest(val amount: Int)
data class ExtendDurationRequest(val effectType: String, val additionalTurns: Int)
