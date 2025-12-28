package com.example.demo.service

import com.example.demo.model.BattleCharacter
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DamageService(
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val playerRepository: PlayerRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository
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

        // Apply minimum damage rules:
        // - NPCs: minimum 1 damage
        // - Players: minimum 0 damage (can be 0)
        val damage = when {
            targetBC.characterType == "npc" -> damageWithDefenseless.coerceAtLeast(1)
            else -> damageWithDefenseless.coerceAtLeast(0)
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

        val newHp = (targetBC.healthPoints - damage).coerceAtLeast(0)
        targetBC.healthPoints = newHp

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

        return newHp
    }
}
