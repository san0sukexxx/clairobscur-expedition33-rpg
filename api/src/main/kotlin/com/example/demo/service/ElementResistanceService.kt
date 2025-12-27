package com.example.demo.service

import com.example.demo.model.ElementResistance
import com.example.demo.repository.ElementResistanceRepository
import org.springframework.stereotype.Service
import kotlin.math.roundToInt

@Service
class ElementResistanceService(
        private val elementResistanceRepository: ElementResistanceRepository
) {
    /**
     * Calculate damage after applying elemental resistances.
     * @param battleCharacterId The ID of the battle character receiving damage
     * @param baseDamage The base damage value
     * @param element The element type (e.g., 'Physical', 'Fire', 'Ice')
     * @return The modified damage after applying resistances
     */
    fun calculateElementalDamage(battleCharacterId: Int, baseDamage: Int, element: String): Int {
        val resistance = elementResistanceRepository
                .findByBattleCharacterIdAndElement(battleCharacterId, element)

        if (resistance == null) {
            return baseDamage // No resistance, return base damage
        }

        // Check for immunity
        if (resistance.resistanceType == "immune") {
            return 0 // No damage if immune
        }

        // Apply damage multiplier
        val multiplier = resistance.damageMultiplier
        val modifiedDamage = (baseDamage * multiplier).roundToInt()

        return modifiedDamage.coerceAtLeast(0) // Ensure damage is not negative
    }

    /**
     * Add or update an elemental resistance for a character.
     * @param battleCharacterId The ID of the battle character
     * @param element The element type
     * @param resistanceType The type of resistance ('immune', 'resist', 'weak')
     * @param multiplier The damage multiplier (0.0 for immune, 0.5 for resist, 1.5 for weak)
     */
    fun addResistance(battleCharacterId: Int, element: String, resistanceType: String, multiplier: Double) {
        val existing = elementResistanceRepository
                .findByBattleCharacterIdAndElement(battleCharacterId, element)

        val resistance = if (existing != null) {
            // Update existing resistance
            existing.copy(
                    resistanceType = resistanceType,
                    damageMultiplier = multiplier
            )
        } else {
            // Create new resistance
            ElementResistance(
                    battleCharacterId = battleCharacterId,
                    element = element,
                    resistanceType = resistanceType,
                    damageMultiplier = multiplier
            )
        }

        elementResistanceRepository.save(resistance)
    }

    /**
     * Remove an elemental resistance from a character.
     * @param battleCharacterId The ID of the battle character
     * @param element The element type to remove resistance for
     */
    fun removeResistance(battleCharacterId: Int, element: String) {
        elementResistanceRepository.deleteByBattleCharacterIdAndElement(battleCharacterId, element)
    }

    /**
     * Get all elemental resistances for a character.
     * @param battleCharacterId The ID of the battle character
     * @return List of all elemental resistances for the character
     */
    fun getResistances(battleCharacterId: Int): List<ElementResistance> {
        return elementResistanceRepository.findByBattleCharacterId(battleCharacterId)
    }

    /**
     * Get the damage multiplier for a specific element.
     * @param battleCharacterId The ID of the battle character
     * @param element The element type
     * @return The damage multiplier (1.0 if no resistance exists)
     */
    fun getDamageMultiplier(battleCharacterId: Int, element: String): Double {
        val resistance = elementResistanceRepository
                .findByBattleCharacterIdAndElement(battleCharacterId, element)

        return resistance?.damageMultiplier ?: 1.0
    }
}
