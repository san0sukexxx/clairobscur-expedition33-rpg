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
        // Apply minimum damage rules:
        // - NPCs: minimum 1 damage
        // - Players: minimum 0 damage (can be 0)
        val damage = when {
            targetBC.characterType == "npc" -> rawDamage.coerceAtLeast(1)
            else -> rawDamage.coerceAtLeast(0)
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
