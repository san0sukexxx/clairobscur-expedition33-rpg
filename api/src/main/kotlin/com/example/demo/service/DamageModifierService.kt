package com.example.demo.service

import com.example.demo.model.DamageModifier
import com.example.demo.repository.DamageModifierRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DamageModifierService(
    private val damageModifierRepository: DamageModifierRepository
) {

    /**
     * Adds a new damage modifier to a character
     */
    @Transactional
    fun addModifier(
        battleCharacterId: Int,
        type: String,
        multiplier: Double,
        flatBonus: Int = 0,
        condition: String? = null
    ): DamageModifier {
        val modifier = DamageModifier(
            battleCharacterId = battleCharacterId,
            modifierType = type,
            multiplier = multiplier,
            flatBonus = flatBonus,
            conditionType = condition,
            isActive = true
        )

        return damageModifierRepository.save(modifier)
    }

    /**
     * Removes a modifier by ID
     */
    @Transactional
    fun removeModifier(modifierId: Int) {
        damageModifierRepository.deleteById(modifierId)
    }

    /**
     * Deactivates a modifier without deleting it
     */
    @Transactional
    fun deactivateModifier(modifierId: Int) {
        val modifier = damageModifierRepository.findById(modifierId).orElse(null) ?: return
        modifier.isActive = false
        damageModifierRepository.save(modifier)
    }

    /**
     * Activates a previously deactivated modifier
     */
    @Transactional
    fun activateModifier(modifierId: Int) {
        val modifier = damageModifierRepository.findById(modifierId).orElse(null) ?: return
        modifier.isActive = true
        damageModifierRepository.save(modifier)
    }

    /**
     * Gets all modifiers for a character
     */
    fun getModifiers(battleCharacterId: Int): List<DamageModifier> {
        return damageModifierRepository.findByBattleCharacterId(battleCharacterId)
    }

    /**
     * Gets only active modifiers for a character
     */
    fun getActiveModifiers(battleCharacterId: Int): List<DamageModifier> {
        return damageModifierRepository.findByBattleCharacterIdAndIsActive(battleCharacterId, true)
    }
}
