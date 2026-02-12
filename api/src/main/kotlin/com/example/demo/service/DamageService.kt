package com.example.demo.service

import com.example.demo.model.BattleCharacter
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.AttackStatusEffectRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DamageService(
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val playerRepository: PlayerRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val attackRepository: AttackRepository,
        private val attackStatusEffectRepository: AttackStatusEffectRepository,
        private val battleLogRepository: com.example.demo.repository.BattleLogRepository,
        private val objectMapper: ObjectMapper
) {

    @Transactional
    fun applyDamage(targetBC: BattleCharacter, rawDamage: Int): Int {
        // Handle element absorption healing (negative damage)
        if (rawDamage < 0) {
            // Convert negative damage to healing (absolute value)
            val healAmount = kotlin.math.abs(rawDamage)
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

            return newHp
        }

        // No damage to apply (e.g., shielded target) - skip all modifiers and minimum damage
        if (rawDamage == 0) {
            return targetBC.healthPoints
        }

        // Normal damage flow (rawDamage > 0)
        // Check if target has invisible-barrier status for -16 damage reduction
        val invisibleBarrierEffects = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(targetBC.id!!, "invisible-barrier")

        val hasInvisibleBarrier = invisibleBarrierEffects.isNotEmpty()

        // Apply invisible-barrier reduction first (-16 damage)
        val damageAfterBarrier = if (hasInvisibleBarrier) {
            (rawDamage - 16).coerceAtLeast(0)  // -16 damage reduction
        } else {
            rawDamage
        }

        // Check if target has Unprotected status for +4 damage
        val hasUnprotected = battleStatusEffectRepository
                .findByBattleCharacterIdAndEffectType(targetBC.id!!, "Unprotected")
                .isNotEmpty()

        // Apply Unprotected bonus if present
        val damageWithUnprotected = if (hasUnprotected) {
            damageAfterBarrier + 4  // +4 damage
        } else {
            damageAfterBarrier
        }

        // Apply minimum damage rules:
        // - NPCs: minimum 1 damage
        // - Players: minimum 0 damage (can be 0)
        val damage = when {
            targetBC.characterType == "npc" -> damageWithUnprotected.coerceAtLeast(1)
            else -> damageWithUnprotected.coerceAtLeast(0)
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

        // Check if damage is greater than twice the resistance to apply Fragile status
        if (damage > 0 && newHp > 0 && targetBC.characterType == "player") {
            val playerId = targetBC.externalId.toIntOrNull()
            if (playerId != null) {
                val player = playerRepository.findById(playerId).orElse(null)
                if (player != null) {
                    val doubleResistance = player.resistance * 2

                    // If damage exceeds double resistance, apply Fragile status
                    if (damage > doubleResistance) {
                        val allTargetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                        val hasBroken = allTargetEffects.any { it.effectType == "Broken" }
                        val hasFragile = allTargetEffects.any { it.effectType == "Fragile" }

                        // Only apply Fragile if not already Broken or Fragile
                        if (!hasBroken && !hasFragile) {
                            val fragileEffect = com.example.demo.model.BattleStatusEffect(
                                battleCharacterId = targetBC.id!!,
                                effectType = "Fragile",
                                ammount = 1,
                                remainingTurns = 3,  // Lasts 3 turns
                                isResolved = true
                            )
                            battleStatusEffectRepository.save(fragileEffect)
                        }
                    }
                }
            }
        }

        val battleId = targetBC.battleId

        if (damage > 0) {
            val fleeingEffects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                targetBC.id!!,
                "Fleeing"
            )

            if (fleeingEffects.isNotEmpty()) {
                val bId = targetBC.battleId ?: return newHp
                val allCharacters = battleCharacterRepository.findByBattleId(bId)
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
            // Check if character has Aureole status for potential revival (check BEFORE cleanup)
            val aureoleEffects = battleStatusEffectRepository.findByBattleCharacterIdAndEffectType(
                    targetBC.id!!,
                    "Aureole"
            )
            val hasAureole = aureoleEffects.isNotEmpty()
            val aureoleStacks = aureoleEffects.firstOrNull()?.ammount ?: 0

            // DEATH CLEANUP: Always perform cleanup when HP reaches 0
            // Zero out MP
            if (targetBC.magicPoints != null) {
                targetBC.magicPoints = 0
            }

            // Clear Perfection Rank when dead (will be reset to A on revival)
            if (targetBC.perfectionRank != null) {
                targetBC.perfectionRank = null
                targetBC.rankProgress = null
            }

            // Remove all turns
            val turns = battleTurnRepository.findByBattleCharacterId(targetBC.id!!)
            if (turns.isNotEmpty()) {
                battleTurnRepository.deleteAllInBatch(turns)
            }

            // Remove all status effects (including Aureole)
            val allEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
            if (allEffects.isNotEmpty()) {
                battleStatusEffectRepository.deleteAll(allEffects)
            }

            // Remove all pending attacks where this character is target or source
            if (battleId != null) {
                // Remove attacks targeting this character
                val attacksAsTarget = attackRepository.findByTargetBattleId(targetBC.id!!)
                if (attacksAsTarget.isNotEmpty()) {
                    // Delete attack status effects first (foreign key constraint)
                    val attackIds = attacksAsTarget.mapNotNull { it.id }
                    if (attackIds.isNotEmpty()) {
                        val attackEffects = attackStatusEffectRepository.findByAttackIdIn(attackIds)
                        if (attackEffects.isNotEmpty()) {
                            attackStatusEffectRepository.deleteAll(attackEffects)
                        }
                    }
                    attackRepository.deleteAll(attacksAsTarget)
                }

                // Remove attacks from this character (as source)
                val attacksAsSource = attackRepository.findByBattleId(battleId)
                    .filter { it.sourceBattleId == targetBC.id!! }
                if (attacksAsSource.isNotEmpty()) {
                    // Delete attack status effects first (foreign key constraint)
                    val attackIds = attacksAsSource.mapNotNull { it.id }
                    if (attackIds.isNotEmpty()) {
                        val attackEffects = attackStatusEffectRepository.findByAttackIdIn(attackIds)
                        if (attackEffects.isNotEmpty()) {
                            attackStatusEffectRepository.deleteAll(attackEffects)
                        }
                    }
                    attackRepository.deleteAll(attacksAsSource)
                }
            }

            // REVIVAL: After cleanup, check if character had Aureole and should revive
            if (hasAureole) {
                val revivalHp = (targetBC.maxHealthPoints * 0.3).toInt().coerceAtLeast(1)
                targetBC.healthPoints = revivalHp

                // Reset Perfection Rank to D on revival (Verso only)
                targetBC.perfectionRank = "D"
                targetBC.rankProgress = 0

                // Log the revival event
                if (battleId != null) {
                    val eventJson = objectMapper.writeValueAsString(
                            mapOf(
                                    "battleCharacterId" to targetBC.id!!,
                                    "characterName" to targetBC.characterName,
                                    "revivalHp" to revivalHp,
                                    "maxHp" to targetBC.maxHealthPoints,
                                    "revivalPercent" to 30
                            )
                    )

                    battleLogRepository.save(
                            BattleLog(
                                    battleId = battleId,
                                    eventType = "AUREOLE_REVIVAL",
                                    eventJson = eventJson
                            )
                    )
                }

                // Save character with revival HP
                battleCharacterRepository.save(targetBC)

                // Sync with player repository
                val playerId = targetBC.externalId.toIntOrNull()
                if (playerId != null) {
                    val player = playerRepository.findById(playerId).orElse(null)
                    if (player != null) {
                        player.hpCurrent = revivalHp
                        // MP was already zeroed in cleanup
                        player.mpCurrent = 0
                        playerRepository.save(player)
                    }
                }

                // Re-add character to turn order (at the end)
                if (battleId != null) {
                    val allTurns = battleTurnRepository.findByBattleId(battleId).sortedBy { it.playOrder }
                    val maxPlayOrder = allTurns.maxOfOrNull { it.playOrder } ?: 0

                    val newTurn = com.example.demo.model.BattleTurn(
                            battleId = battleId,
                            battleCharacterId = targetBC.id!!,
                            playOrder = maxPlayOrder + 1  // Add at the end
                    )
                    battleTurnRepository.save(newTurn)
                }

                // Re-add remaining Aureole stacks (consume only 1 stack per revival)
                val remainingAureoleStacks = aureoleStacks - 1
                if (remainingAureoleStacks > 0) {
                    val aureoleEffect = BattleStatusEffect(
                            battleCharacterId = targetBC.id!!,
                            effectType = "Aureole",
                            ammount = remainingAureoleStacks,
                            remainingTurns = null,  // No turn limit
                            isResolved = true,
                            skipNextDecrement = false
                    )
                    battleStatusEffectRepository.save(aureoleEffect)
                }

                // Return revival HP instead of 0
                return revivalHp
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

        // IntenseFlames mechanic: If character took damage (and survived), remove IntenseFlames effects they caused
        if (damage > 0 && newHp > 0 && battleId != null) {
            removeIntenseFlamesFromSource(battleId, targetBC)
        }

        return newHp
    }

    /**
     * Removes IntenseFlames status effects caused by a character when they take damage
     */
    @Transactional
    private fun removeIntenseFlamesFromSource(battleId: Int, sourceCharacter: BattleCharacter) {
        val sourceId = sourceCharacter.id ?: return

        // Find all IntenseFlames effects caused by this character
        val intenseFlamesEffects = battleStatusEffectRepository.findByEffectTypeAndSourceCharacterId(
                "IntenseFlames",
                sourceId
        )

        // Remove all IntenseFlames effects caused by this character
        intenseFlamesEffects.forEach { effect ->
            battleStatusEffectRepository.delete(effect)

            // Log the removal
            val eventJson = objectMapper.writeValueAsString(
                    mapOf(
                            "sourceCharacterId" to sourceId,
                            "sourceName" to sourceCharacter.characterName,
                            "targetCharacterId" to effect.battleCharacterId,
                            "effectRemoved" to "IntenseFlames",
                            "reason" to "source_took_damage"
                    )
            )

            battleLogRepository.save(
                    BattleLog(
                            battleId = battleId,
                            eventType = "STATUS_REMOVED",
                            eventJson = eventJson
                    )
            )
        }
    }
}
