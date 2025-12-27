package com.example.demo.service

import com.example.demo.model.StatusImmunity
import com.example.demo.repository.StatusImmunityRepository
import org.springframework.stereotype.Service
import kotlin.random.Random

@Service
class ImmunityService(
        private val statusImmunityRepository: StatusImmunityRepository
) {
    /**
     * Check if a status can be applied to a character based on their immunities.
     * @param battleCharacterId The ID of the battle character
     * @param statusType The type of status effect to check (e.g., 'Burning', 'Frozen')
     * @return true if the status can be applied, false if immune or resisted
     */
    fun canApplyStatus(battleCharacterId: Int, statusType: String): Boolean {
        val immunities = statusImmunityRepository
                .findByBattleCharacterIdAndStatusType(battleCharacterId, statusType)

        if (immunities.isEmpty()) {
            return true // No immunity, status can be applied
        }

        // Check for complete immunity
        val hasImmunity = immunities.any { it.immunityType == "immune" }
        if (hasImmunity) {
            return false // Character is immune
        }

        // Check for resistance (chance-based)
        val resistance = immunities.firstOrNull { it.immunityType == "resist" }
        if (resistance != null) {
            val resistChance = resistance.resistChance ?: 0
            val roll = Random.nextInt(0, 100)
            return roll >= resistChance // Status is resisted if roll < resistChance
        }

        return true
    }

    /**
     * Add an immunity or resistance to a character.
     * @param battleCharacterId The ID of the battle character
     * @param statusType The type of status to be immune/resistant to
     * @param immunityType The type of immunity ('immune' or 'resist')
     * @param resistChance For 'resist' type, the chance to avoid the status (0-100)
     */
    fun addImmunity(battleCharacterId: Int, statusType: String, immunityType: String, resistChance: Int? = null) {
        // Check if immunity already exists
        val existing = statusImmunityRepository
                .findByBattleCharacterIdAndStatusType(battleCharacterId, statusType)
                .firstOrNull { it.immunityType == immunityType }

        if (existing == null) {
            val immunity = StatusImmunity(
                    battleCharacterId = battleCharacterId,
                    statusType = statusType,
                    immunityType = immunityType,
                    resistChance = resistChance
            )
            statusImmunityRepository.save(immunity)
        }
    }

    /**
     * Remove an immunity from a character.
     * @param battleCharacterId The ID of the battle character
     * @param statusType The type of status to remove immunity for
     */
    fun removeImmunity(battleCharacterId: Int, statusType: String) {
        statusImmunityRepository.deleteByBattleCharacterIdAndStatusType(battleCharacterId, statusType)
    }

    /**
     * Get all immunities for a character.
     * @param battleCharacterId The ID of the battle character
     * @return List of all status immunities for the character
     */
    fun getImmunities(battleCharacterId: Int): List<StatusImmunity> {
        return statusImmunityRepository.findByBattleCharacterId(battleCharacterId)
    }
}
