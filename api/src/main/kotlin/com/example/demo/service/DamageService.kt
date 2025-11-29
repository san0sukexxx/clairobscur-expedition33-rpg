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
        val damage = rawDamage.coerceAtLeast(0)
        if (damage <= 0) return targetBC.healthPoints

        val newHp = (targetBC.healthPoints - damage).coerceAtLeast(0)
        targetBC.healthPoints = newHp

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
