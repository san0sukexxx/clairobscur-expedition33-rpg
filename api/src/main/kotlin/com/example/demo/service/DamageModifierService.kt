package com.example.demo.service

import com.example.demo.model.DamageModifier
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.DamageModifierRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.math.roundToInt

@Service
class DamageModifierService(
    private val damageModifierRepository: DamageModifierRepository,
    private val battleCharacterRepository: BattleCharacterRepository,
    private val battleStatusEffectRepository: BattleStatusEffectRepository
) {

    /**
     * Calculates modified damage based on active modifiers
     *
     * @param battleCharacterId The ID of the character dealing damage
     * @param baseDamage The base damage before modifiers
     * @param attackType The type of attack: 'base-attack', 'counter', 'free-aim', 'skill', etc.
     * @param context Additional context for condition evaluation:
     *   - 'isFirstHit': Boolean - true if this is the first hit in combat
     *   - 'targetBattleCharacterId': Int - ID of the target character
     *   - 'isSolo': Boolean - true if character is fighting alone
     *   - etc.
     */
    fun calculateModifiedDamage(
        battleCharacterId: Int,
        baseDamage: Int,
        attackType: String,
        context: Map<String, Any> = emptyMap()
    ): Int {
        // Get all active modifiers for the character
        val activeModifiers = damageModifierRepository
            .findByBattleCharacterIdAndIsActive(battleCharacterId, true)

        if (activeModifiers.isEmpty()) {
            return baseDamage
        }

        // Filter modifiers that apply to this attack type
        val applicableModifiers = activeModifiers.filter { modifier ->
            when (modifier.modifierType) {
                "all" -> true  // Applies to all attack types
                "base-attack" -> attackType == "basic"
                "counter" -> attackType == "counter"
                "free-aim" -> attackType == "free-shot"
                "skill" -> attackType == "skill"
                "first-hit" -> attackType == "basic" && context["isFirstHit"] == true
                else -> modifier.modifierType == attackType
            }
        }

        // Further filter by condition
        val validModifiers = applicableModifiers.filter { modifier ->
            evaluateCondition(modifier, battleCharacterId, context)
        }

        if (validModifiers.isEmpty()) {
            return baseDamage
        }

        // Apply multipliers first (multiplicative)
        var modifiedDamage = baseDamage.toDouble()
        validModifiers.forEach { modifier ->
            modifiedDamage *= modifier.multiplier
        }

        // Then apply flat bonuses (additive)
        val totalFlatBonus = validModifiers.sumOf { it.flatBonus }
        modifiedDamage += totalFlatBonus

        return modifiedDamage.roundToInt().coerceAtLeast(0)
    }

    /**
     * Evaluates if a modifier's condition is met
     */
    private fun evaluateCondition(
        modifier: DamageModifier,
        battleCharacterId: Int,
        context: Map<String, Any>
    ): Boolean {
        val condition = modifier.conditionType ?: return true  // No condition = always active

        return when (condition.lowercase()) {
            "solo" -> {
                // Check if character is fighting alone (no allies)
                context["isSolo"] as? Boolean ?: false
            }
            "full-hp" -> {
                // Check if character is at full HP
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                character?.let { it.healthPoints >= it.maxHealthPoints } ?: false
            }
            "low-hp" -> {
                // Check if character is at low HP (< 30%)
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                character?.let {
                    val hpPercent = (it.healthPoints.toDouble() / it.maxHealthPoints.toDouble()) * 100
                    hpPercent < 30.0
                } ?: false
            }
            "enemy-burning" -> {
                // Check if target enemy has Burning status
                val targetId = context["targetBattleCharacterId"] as? Int ?: return false
                val effects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                effects.any { it.effectType == "Burning" }
            }
            "enemy-marked" -> {
                // Check if target enemy has Marked status
                val targetId = context["targetBattleCharacterId"] as? Int ?: return false
                val effects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                effects.any { it.effectType == "Marked" }
            }
            "enemy-fragile" -> {
                // Check if target enemy has Fragile status
                val targetId = context["targetBattleCharacterId"] as? Int ?: return false
                val effects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                effects.any { it.effectType == "Fragile" }
            }
            "has-charges" -> {
                // Check if character has charge points
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                character?.let { (it.chargePoints ?: 0) > 0 } ?: false
            }
            "max-charges" -> {
                // Check if character has max charge points
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
                character?.let {
                    val current = it.chargePoints ?: 0
                    val max = it.maxChargePoints ?: 0
                    max > 0 && current >= max
                } ?: false
            }
            "twilight-active" -> {
                // Check if character has Twilight status
                val effects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
                effects.any { it.effectType == "Twilight" }
            }
            else -> {
                // Unknown condition, default to false
                false
            }
        }
    }

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
