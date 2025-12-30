package com.example.demo.service

import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.PlayerPictoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AntiStatusService(
    private val battleCharacterRepository: BattleCharacterRepository,
    private val battleStatusEffectRepository: BattleStatusEffectRepository,
    private val playerPictoRepository: PlayerPictoRepository
) {

    private val antiStatusMap = mapOf(
        "anti-bound" to "Bound",
        "anti-curse" to "Cursed",
        "anti-dizzy" to "Dizzy",
        "anti-exhaust" to "Exhaust",
        "anti-inverted" to "Inverted",
        "anti-blight" to "Blight",
        "anti-burn" to "Burning",
        "anti-charm" to "Charm",
        "anti-freeze" to "Frozen",
        "anti-stun" to "Stunned",
        "anti-curse-ii" to "Cursed",
        "anti-dizzy-ii" to "Dizzy",
        "anti-exhaust-ii" to "Exhaust",
        "anti-stun-ii" to "Stunned"
    )

    /**
     * Checks if a character has anti-status protection and removes the status if protected
     *
     * @param battleCharacterId The character receiving the status
     * @param statusType The status effect type being applied
     * @return true if status was blocked/removed, false otherwise
     */
    @Transactional
    fun checkAndRemoveStatus(battleCharacterId: Int, statusType: String): Boolean {
        val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
            ?: return false

        if (character.characterType != "player") return false

        val playerId = character.externalId.toIntOrNull() ?: return false
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        // Find anti-status picto that protects against this status
        val protectingPicto = antiStatusMap.entries.find { (pictoName, protectedStatus) ->
            protectedStatus == statusType &&
            pictos.any {
                it.pictoId.lowercase() == pictoName.lowercase() &&
                it.slot != null &&
                it.slot in 0..2
            }
        }

        if (protectingPicto != null) {
            // Remove the status effect
            val statusEffects = battleStatusEffectRepository
                .findByBattleCharacterId(battleCharacterId)
                .filter { it.effectType == statusType }

            statusEffects.forEach { effect ->
                battleStatusEffectRepository.deleteById(effect.id!!)
            }

            return true
        }

        return false
    }
}
