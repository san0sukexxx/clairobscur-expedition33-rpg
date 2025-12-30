package com.example.demo.service

import com.example.demo.model.BattleCharacter
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DamageService(
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val playerRepository: PlayerRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val pictoEffectTrackerService: PictoEffectTrackerService,
        private val playerPictoRepository: com.example.demo.repository.PlayerPictoRepository,
        private val battleLogRepository: com.example.demo.repository.BattleLogRepository,
        private val battleTurnDamageTrackerRepository: com.example.demo.repository.BattleTurnDamageTrackerRepository,
        private val objectMapper: ObjectMapper
) {

    @Transactional
    fun applyDamage(targetBC: BattleCharacter, rawDamage: Int): Int {
        // Handle element absorption healing (negative damage)
        if (rawDamage < 0) {
            // Check if character has Confident picto - blocks ALL healing
            if (hasConfidentPicto(targetBC)) {
                // Cannot be healed - log and return current HP without change
                val battleId = targetBC.battleId
                if (battleId != null) {
                    val eventJson = objectMapper.writeValueAsString(
                            mapOf(
                                    "battleCharacterId" to targetBC.id!!,
                                    "characterName" to targetBC.characterName,
                                    "healingBlocked" to kotlin.math.abs(rawDamage),
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
                }
                return targetBC.healthPoints  // Return current HP, no healing applied
            }

            // Convert negative damage to healing (absolute value)
            val baseHealAmount = kotlin.math.abs(rawDamage)
            // Apply Effective Heal modifier (doubles healing if equipped)
            val healAmount = applyEffectiveHeal(targetBC, baseHealAmount)
            val newHp = (targetBC.healthPoints + healAmount).coerceAtMost(targetBC.maxHealthPoints)
            targetBC.healthPoints = newHp
            battleCharacterRepository.save(targetBC)

            // Sync HP with player repository if applicable
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

            // Apply Healing Share: distribute 15% of heal to characters with healing-share picto
            val battleId = targetBC.battleId
            if (battleId != null && healAmount > 0) {
                applyHealingShare(battleId, targetBC, healAmount)
            }

            return newHp
        }

        // Normal damage flow (rawDamage >= 0)
        // Check if target has invisible-barrier status for 90% damage reduction
        val invisibleBarrierEffects = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(targetBC.id!!, "invisible-barrier")

        val hasInvisibleBarrier = invisibleBarrierEffects.isNotEmpty()

        // Apply invisible-barrier reduction first (90% reduction = 10% damage)
        val damageAfterBarrier = if (hasInvisibleBarrier) {
            (rawDamage * 0.1).toInt()  // 90% reduction
        } else {
            rawDamage
        }

        // Check if target has Unprotected (Defenseless) status for +25% damage
        val hasUnprotected = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(targetBC.id!!, "Unprotected")
                .isNotEmpty()

        // Apply Defenseless bonus if present
        val damageWithDefenseless = if (hasUnprotected) {
            (damageAfterBarrier * 1.25).toInt()  // +25% damage
        } else {
            damageAfterBarrier
        }

        // Apply Confident picto: 50% damage reduction
        val hasConfident = hasConfidentPicto(targetBC)
        val damageWithConfident = if (hasConfident) {
            (damageWithDefenseless * 0.5).toInt()  // 50% reduction
        } else {
            damageWithDefenseless
        }

        // Apply Defensive Mode: 30% damage reduction if MP > 0, consume 1 MP
        val hasDefensiveMode = hasDefensiveModePicto(targetBC)
        val currentMp = targetBC.magicPoints ?: 0
        val damageWithDefensiveMode = if (hasDefensiveMode && currentMp > 0) {
            // Reduce damage by 30%, round up the reduction
            val reduction = kotlin.math.ceil(damageWithConfident * 0.3).toInt()
            val reducedDamage = damageWithConfident - reduction

            // Consume 1 MP
            targetBC.magicPoints = (currentMp - 1).coerceAtLeast(0)

            reducedDamage
        } else {
            damageWithConfident
        }

        // Apply minimum damage rules:
        // - NPCs: minimum 1 damage
        // - Players: minimum 0 damage (can be 0)
        val damage = when {
            targetBC.characterType == "npc" -> damageWithDefensiveMode.coerceAtLeast(1)
            else -> damageWithDefensiveMode.coerceAtLeast(0)
        }

        // Reduce invisible-barrier amount by 1 after taking damage
        if (hasInvisibleBarrier && damage > 0) {
            val barrierEffect = invisibleBarrierEffects.first()
            if (barrierEffect.ammount > 1) {
                barrierEffect.ammount -= 1
                battleStatusEffectRepository.save(barrierEffect)
            } else {
                battleStatusEffectRepository.delete(barrierEffect)
            }
        }

        val oldHp = targetBC.healthPoints
        val newHp = (targetBC.healthPoints - damage).coerceAtLeast(0)
        targetBC.healthPoints = newHp

        // Check for Solidifying picto - trigger when HP drops below 50%
        val battleId = targetBC.battleId
        if (battleId != null && damage > 0 && newHp > 0) {
            checkSolidifying(battleId, targetBC, oldHp, newHp)
            checkShortcut(battleId, targetBC, oldHp, newHp)
        }

        if (damage > 0) {
            val fleeingEffects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                targetBC.id!!,
                "Fleeing"
            )

            if (fleeingEffects.isNotEmpty()) {
                val battleId = targetBC.battleId ?: return newHp
                val allCharacters = battleCharacterRepository.findByBattleId(battleId)
                val teamMembers = allCharacters.filter { it.isEnemy == targetBC.isEnemy }

                teamMembers.forEach { member ->
                    val memberFleeingEffects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                        member.id!!,
                        "Fleeing"
                    )
                    if (memberFleeingEffects.isNotEmpty()) {
                        battleStatusEffectRepository.deleteAll(memberFleeingEffects)
                    }
                }
            }
        }

        if (newHp == 0) {
            // Check for Death Bomb picto - deal damage to all enemies before dying
            if (battleId != null && oldHp > 0) {
                checkDeathBomb(battleId, targetBC)
            }

            if (targetBC.magicPoints != null) {
                targetBC.magicPoints = 0
            }

            val turns = battleTurnRepository.findByBattleCharacterId(targetBC.id!!)
            if (turns.isNotEmpty()) {
                battleTurnRepository.deleteAllInBatch(turns)
            }

            val allEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
            if (allEffects.isNotEmpty()) {
                battleStatusEffectRepository.deleteAll(allEffects)
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

        // Track damage for Clea's Life picto (only track actual damage, not healing)
        if (damage > 0 && battleId != null) {
            trackDamage(battleId, targetBC.id!!, damage)
        }

        return newHp
    }

    /**
     * Checks if character has "Solidifying" picto equipped and triggers it when HP drops below 50%.
     * Adds 2 Shield status effects when:
     * 1. Character has this picto equipped (slots 0-2)
     * 2. HP drops below 50% for the FIRST time in battle (tracked with once-per-battle)
     * 3. Character HP was above 50% before damage and is now below 50%
     */
    @Transactional
    fun checkSolidifying(
            battleId: Int,
            battleCharacter: BattleCharacter,
            oldHp: Int,
            newHp: Int
    ) {
        // Only works for player characters
        if (battleCharacter.characterType != "player") {
            return
        }

        // Check if player has Solidifying picto equipped (slots 0-2)
        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasSolidifying = pictos.any {
            it.pictoId.lowercase() == "solidifying" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasSolidifying) {
            return
        }

        // Check if effect can be activated (once-per-battle)
        val canActivate = pictoEffectTrackerService.canActivate(
                battleId,
                battleCharacter.id!!,
                "Solidifying",
                "once-per-battle"
        )

        if (!canActivate) {
            return
        }

        // Calculate 50% threshold
        val maxHp = battleCharacter.maxHealthPoints
        val threshold = maxHp / 2

        // Check if HP crossed below 50% threshold (was above, now below)
        val wasAbove50 = oldHp > threshold
        val isBelow50 = newHp <= threshold

        if (wasAbove50 && isBelow50) {
            // Activate Solidifying: add 2 Shield status effects
            val existingShields = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                    battleCharacter.id!!,
                    "Shield"
            )

            val currentShields = existingShields.firstOrNull()?.ammount ?: 0
            val newShields = currentShields + 2

            if (currentShields > 0) {
                // Update existing shield
                val shieldEffect = existingShields.first()
                battleStatusEffectRepository.save(shieldEffect.copy(ammount = newShields))
            } else {
                // Create new shield status
                val shieldEffect = BattleStatusEffect(
                        battleCharacterId = battleCharacter.id!!,
                        effectType = "Shield",
                        ammount = 2,
                        remainingTurns = null,  // Shield doesn't expire by turns
                        isResolved = true,      // Passive effect
                        skipNextDecrement = false
                )
                battleStatusEffectRepository.save(shieldEffect)
            }

            // Track that the effect was used
            pictoEffectTrackerService.track(
                    battleId,
                    battleCharacter.id!!,
                    "Solidifying",
                    "once-per-battle"
            )

            // Log the event
            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to battleCharacter.id!!,
                            "characterName" to battleCharacter.characterName,
                            "oldHp" to oldHp,
                            "newHp" to newHp,
                            "threshold" to threshold,
                            "shieldsAdded" to 2,
                            "totalShields" to newShields,
                            "result" to "activated"
                    )
            )

            battleLogRepository.save(
                    BattleLog(
                            battleId = battleId,
                            eventType = "SOLIDIFYING",
                            eventJson = eventJson
                    )
            )
        }
    }

    /**
     * Checks if character has "Confident" picto equipped.
     * Returns true if the picto is equipped in slots 0-2.
     */
    private fun hasConfidentPicto(battleCharacter: BattleCharacter): Boolean {
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

    /**
     * Checks if character has "Defensive Mode" picto equipped.
     * Returns true if the picto is equipped in slots 0-2.
     */
    private fun hasDefensiveModePicto(battleCharacter: BattleCharacter): Boolean {
        if (battleCharacter.characterType != "player") {
            return false
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        return pictos.any {
            it.pictoId.lowercase() == "defensive-mode" &&
            it.slot != null &&
            it.slot in 0..2
        }
    }

    /**
     * Checks if character has "Effective Heal" picto equipped.
     * Returns true if the picto is equipped in slots 0-2.
     */
    private fun hasEffectiveHealPicto(battleCharacter: BattleCharacter): Boolean {
        if (battleCharacter.characterType != "player") {
            return false
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        return pictos.any {
            (it.pictoId.lowercase() == "effective-heal" || it.pictoId.lowercase() == "better-healing-tint") &&
            it.slot != null &&
            it.slot in 0..2
        }
    }

    /**
     * Applies Effective Heal picto modifier to healing amount.
     * If character has Effective Heal equipped, doubles the healing.
     */
    fun applyEffectiveHeal(battleCharacter: BattleCharacter, healAmount: Int): Int {
        if (hasEffectiveHealPicto(battleCharacter)) {
            return healAmount * 2
        }
        return healAmount
    }

    /**
     * Checks if character has "Shortcut" picto equipped and inserts them as first in turn order.
     * Shortcut: "Immediately play when falling below 30% Health. Once per battle."
     */
    @Transactional
    fun checkShortcut(
            battleId: Int,
            battleCharacter: BattleCharacter,
            oldHp: Int,
            newHp: Int
    ) {
        // Only works for player characters
        if (battleCharacter.characterType != "player") {
            return
        }

        // Check if player has Shortcut picto equipped (slots 0-2)
        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasShortcut = pictos.any {
            it.pictoId.lowercase() == "shortcut" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasShortcut) {
            return
        }

        // Check if effect can be activated (once-per-battle)
        val canActivate = pictoEffectTrackerService.canActivate(
                battleId,
                battleCharacter.id!!,
                "Shortcut",
                "once-per-battle"
        )

        if (!canActivate) {
            return
        }

        // Calculate 30% threshold
        val maxHp = battleCharacter.maxHealthPoints
        val threshold = (maxHp * 0.3).toInt()

        // Check if HP crossed below 30% threshold (was above, now below)
        val wasAbove30 = oldHp > threshold
        val isBelow30 = newHp <= threshold

        if (wasAbove30 && isBelow30) {
            // Get all current turns for this battle, sorted by playOrder
            val allTurns = battleTurnRepository.findByBattleId(battleId).sortedBy { it.playOrder }

            if (allTurns.isEmpty()) {
                return
            }

            // Find the lowest playOrder value (first to play)
            val lowestPlayOrder = allTurns.first().playOrder

            // Insert this character with playOrder = lowestPlayOrder - 1 (to be first)
            val newTurn = com.example.demo.model.BattleTurn(
                    battleId = battleId,
                    battleCharacterId = battleCharacter.id!!,
                    playOrder = lowestPlayOrder - 1
            )

            battleTurnRepository.save(newTurn)

            // Track that the effect was used
            pictoEffectTrackerService.track(
                    battleId,
                    battleCharacter.id!!,
                    "Shortcut",
                    "once-per-battle"
            )

            // Log the event
            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to battleCharacter.id!!,
                            "characterName" to battleCharacter.characterName,
                            "oldHp" to oldHp,
                            "newHp" to newHp,
                            "threshold" to threshold,
                            "newPlayOrder" to (lowestPlayOrder - 1),
                            "result" to "activated"
                    )
            )

            battleLogRepository.save(
                    com.example.demo.model.BattleLog(
                            battleId = battleId,
                            eventType = "SHORTCUT",
                            eventJson = eventJson
                    )
            )
        }
    }

    /**
     * Tracks damage taken by a character in the current turn.
     * Used by Clea's Life picto to determine if character took damage since last turn.
     */
    @Transactional
    fun trackDamage(battleId: Int, battleCharacterId: Int, damage: Int) {
        // Get current turn number (we'll use a simple counter)
        // For now, we'll just track "current turn" - we'll reset this when turn changes
        val turnNumber = 0  // Simplified: all damage in "current turn"

        val tracker = battleTurnDamageTrackerRepository.findByBattleIdAndBattleCharacterIdAndTurnNumber(
                battleId,
                battleCharacterId,
                turnNumber
        )

        if (tracker != null) {
            tracker.damageTaken += damage
            battleTurnDamageTrackerRepository.save(tracker)
        } else {
            val newTracker = com.example.demo.model.BattleTurnDamageTracker(
                    battleId = battleId,
                    battleCharacterId = battleCharacterId,
                    turnNumber = turnNumber,
                    damageTaken = damage
            )
            battleTurnDamageTrackerRepository.save(newTracker)
        }
    }

    /**
     * Checks if character took damage in previous turn.
     * Returns true if character took ANY damage (> 0) in previous turn.
     */
    fun tookDamageLastTurn(battleId: Int, battleCharacterId: Int): Boolean {
        val tracker = battleTurnDamageTrackerRepository.findByBattleIdAndBattleCharacterIdAndTurnNumber(
                battleId,
                battleCharacterId,
                0  // Current turn tracking
        )
        return tracker != null && tracker.damageTaken > 0
    }

    /**
     * Resets damage tracking for a character when their turn starts.
     * This marks the previous turn's damage and prepares for new turn tracking.
     */
    @Transactional
    fun resetDamageTracking(battleId: Int, battleCharacterId: Int) {
        // Delete existing tracker to start fresh for next turn
        val tracker = battleTurnDamageTrackerRepository.findByBattleIdAndBattleCharacterIdAndTurnNumber(
                battleId,
                battleCharacterId,
                0
        )
        if (tracker != null) {
            battleTurnDamageTrackerRepository.delete(tracker)
        }
    }

    /**
     * Checks if character has "Clea's Life" picto equipped.
     * Returns true if the picto is equipped in slots 0-2.
     */
    private fun hasCleasLifePicto(battleCharacter: BattleCharacter): Boolean {
        if (battleCharacter.characterType != "player") {
            return false
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        return pictos.any {
            it.pictoId.lowercase() == "cleas-life" &&
            it.slot != null &&
            it.slot in 0..2
        }
    }

    /**
     * Checks and applies Clea's Life picto effect.
     * If character has Clea's Life and took no damage last turn, heal to 100% HP.
     */
    @Transactional
    fun checkCleasLife(battleId: Int, battleCharacter: BattleCharacter) {
        // Only works for player characters
        if (battleCharacter.characterType != "player") {
            return
        }

        // Check if player has Clea's Life picto equipped
        if (!hasCleasLifePicto(battleCharacter)) {
            return
        }

        // Check if character took damage in previous turn
        val tookDamage = tookDamageLastTurn(battleId, battleCharacter.id!!)

        if (!tookDamage) {
            // Heal to 100% HP
            val oldHp = battleCharacter.healthPoints
            battleCharacter.healthPoints = battleCharacter.maxHealthPoints
            battleCharacterRepository.save(battleCharacter)

            // Sync HP with player repository
            val playerId = battleCharacter.externalId.toIntOrNull()
            if (playerId != null) {
                val player = playerRepository.findById(playerId).orElse(null)
                if (player != null) {
                    player.hpCurrent = battleCharacter.healthPoints
                    playerRepository.save(player)
                }
            }

            // Apply Healing Share: distribute 15% of heal to characters with healing-share picto
            val healAmount = battleCharacter.healthPoints - oldHp
            applyHealingShare(battleId, battleCharacter, healAmount)

            // Log the event
            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "battleCharacterId" to battleCharacter.id!!,
                            "characterName" to battleCharacter.characterName,
                            "oldHp" to oldHp,
                            "newHp" to battleCharacter.healthPoints,
                            "healAmount" to healAmount,
                            "result" to "activated"
                    )
            )

            battleLogRepository.save(
                    com.example.demo.model.BattleLog(
                            battleId = battleId,
                            eventType = "CLEAS_LIFE",
                            eventJson = eventJson
                    )
            )
        }

        // Reset damage tracking for this character's new turn
        resetDamageTracking(battleId, battleCharacter.id!!)
    }

    /**
     * Applies Healing Share effect to all characters with healing-share picto equipped.
     * Healing Share: "Receive 15% of all Heals affecting other characters."
     * When any character receives healing, distribute 15% (rounded up) to all characters
     * with healing-share picto equipped (except the original healed character).
     */
    @Transactional
    fun applyHealingShare(battleId: Int, healedCharacter: BattleCharacter, healAmount: Int) {
        if (healAmount <= 0) {
            return
        }

        // Get all characters in the battle
        val allCharacters = battleCharacterRepository.findByBattleId(battleId)

        // Find all characters with healing-share picto equipped (excluding the original healed character)
        allCharacters.forEach { character ->
            // Skip the character who just received the original heal
            if (character.id == healedCharacter.id) {
                return@forEach
            }

            // Skip dead characters
            if (character.healthPoints <= 0) {
                return@forEach
            }

            // Only works for player characters
            if (character.characterType != "player") {
                return@forEach
            }

            // Check if player has Healing Share picto equipped (slots 0-2)
            val playerId = character.externalId.toIntOrNull()
            if (playerId != null) {
                val pictos = playerPictoRepository.findByPlayerId(playerId)
                val hasHealingShare = pictos.any {
                    it.pictoId.lowercase() == "healing-share" &&
                    it.slot != null &&
                    it.slot in 0..2
                }

                if (hasHealingShare) {
                    // Calculate 15% of heal amount, rounded up
                    val sharedHeal = kotlin.math.ceil(healAmount * 0.15).toInt()

                    // Check if character has Confident picto - blocks healing
                    if (hasConfidentPicto(character)) {
                        // Log that healing was blocked
                        val eventJson = objectMapper.writeValueAsString(
                            mapOf(
                                "battleCharacterId" to character.id!!,
                                "characterName" to character.characterName,
                                "healingBlocked" to sharedHeal,
                                "healingType" to "healing_share",
                                "reason" to "confident_picto"
                            )
                        )

                        battleLogRepository.save(
                            com.example.demo.model.BattleLog(
                                battleId = battleId,
                                eventType = "HEALING_BLOCKED",
                                eventJson = eventJson
                            )
                        )
                    } else {
                        // Apply the shared heal
                        val oldHp = character.healthPoints
                        val newHp = (character.healthPoints + sharedHeal).coerceAtMost(character.maxHealthPoints)
                        character.healthPoints = newHp
                        battleCharacterRepository.save(character)

                        // Sync HP with player repository
                        val player = playerRepository.findById(playerId).orElse(null)
                        if (player != null) {
                            player.hpCurrent = newHp
                            playerRepository.save(player)
                        }

                        // Log the healing share event
                        val eventJson = objectMapper.writeValueAsString(
                            mapOf(
                                "battleCharacterId" to character.id!!,
                                "characterName" to character.characterName,
                                "originalHealedCharacter" to healedCharacter.characterName,
                                "originalHealAmount" to healAmount,
                                "sharedHealAmount" to sharedHeal,
                                "oldHp" to oldHp,
                                "newHp" to newHp
                            )
                        )

                        battleLogRepository.save(
                            com.example.demo.model.BattleLog(
                                battleId = battleId,
                                eventType = "HEALING_SHARE",
                                eventJson = eventJson
                            )
                        )
                    }
                }
            }
        }
    }

    /**
     * Checks if dying character has "Death Bomb" picto equipped.
     * Death Bomb: "On Death, deal damage to all enemies."
     * When character dies (HP drops to 0), deals basic attack damage to all enemy characters.
     */
    @Transactional
    fun checkDeathBomb(battleId: Int, dyingCharacter: BattleCharacter) {
        // Only works for player characters
        if (dyingCharacter.characterType != "player") {
            return
        }

        // Check if player has Death Bomb picto equipped (slots 0-2)
        val playerId = dyingCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasDeathBomb = pictos.any {
            it.pictoId.lowercase() == "death-bomb" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasDeathBomb) {
            return
        }

        // Get all enemy characters in the battle
        val allCharacters = battleCharacterRepository.findByBattleId(battleId)
        val enemies = allCharacters.filter { it.isEnemy != dyingCharacter.isEnemy && it.healthPoints > 0 }

        if (enemies.isEmpty()) {
            return
        }

        // Calculate basic attack damage (using a simple formula based on character's max stats)
        // Since we don't have weapon power here, we'll use a percentage of max HP as base damage
        val baseDamage = (dyingCharacter.maxHealthPoints * 0.15).toInt().coerceAtLeast(5)

        // Deal damage to each enemy
        enemies.forEach { enemy ->
            applyDamage(enemy, baseDamage)
        }

        // Log the Death Bomb event
        val eventJson = objectMapper.writeValueAsString(
            mapOf(
                "dyingCharacterId" to dyingCharacter.id!!,
                "dyingCharacterName" to dyingCharacter.characterName,
                "baseDamage" to baseDamage,
                "enemiesHit" to enemies.size
            )
        )

        battleLogRepository.save(
            BattleLog(
                battleId = battleId,
                eventType = "DEATH_BOMB",
                eventJson = eventJson
            )
        )
    }
}
