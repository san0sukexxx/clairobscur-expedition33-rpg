package com.example.demo.service

import com.example.demo.dto.CreateBattleRequest
import com.example.demo.model.Battle
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleStatusEffectRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleService(
        private val battleRepository: BattleRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val battleCharacterRepository: BattleCharacterRepository
) {

    fun create(request: CreateBattleRequest): Int {
        val battle = Battle(campaignId = request.campaignId, battleStatus = request.battleStatus)
        val saved = battleRepository.save(battle)
        return saved.id!!
    }

    @Transactional
    fun consumeShield(battleCharacterId: Int) {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null) ?: return

        val effects = battleStatusEffectRepository.findByBattleCharacterId(bc.id!!)

        val shield = effects.firstOrNull { it.effectType == "Shielded" }

        if (shield != null) {
            val current = shield.ammount ?: 0
            if (current > 0) {
                val next = current - 1

                if (next <= 0) {
                    battleStatusEffectRepository.delete(shield)
                } else {
                    battleStatusEffectRepository.save(shield.copy(ammount = next))
                }
            }
        }
    }
    
    @Transactional
    fun removeMarked(battleCharacterId: Int) {
        val bc = battleCharacterRepository.findById(battleCharacterId).orElse(null) ?: return

        val effects = battleStatusEffectRepository.findByBattleCharacterId(bc.id!!)

        val marked = effects.filter { it.effectType == "Marked" }

        if (marked.isNotEmpty()) {
            battleStatusEffectRepository.deleteAll(marked)
        }
    }
}
