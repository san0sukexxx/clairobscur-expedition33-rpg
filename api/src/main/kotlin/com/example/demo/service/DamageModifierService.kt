package com.example.demo.service

import com.example.demo.model.DamageModifier
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.DamageModifierRepository
import com.example.demo.repository.PlayerPictoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.math.roundToInt

@Service
class DamageModifierService(
    private val damageModifierRepository: DamageModifierRepository,
    private val battleCharacterRepository: BattleCharacterRepository,
    private val battleStatusEffectRepository: BattleStatusEffectRepository,
    private val pictoEffectTrackerService: PictoEffectTrackerService,
    private val playerPictoRepository: PlayerPictoRepository
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

        // Empowering Parry: Apply +5% damage per stack of EmpoweringParry status
        val empoweringParryEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
            .filter { it.effectType == "EmpoweringParry" }
        if (empoweringParryEffects.isNotEmpty()) {
            val totalStacks = empoweringParryEffects.sumOf { it.ammount }
            // Each stack = +5% damage (0.05 multiplier per stack)
            val empoweringParryMultiplier = 1.0 + (totalStacks * 0.05)
            modifiedDamage *= empoweringParryMultiplier
        }

        // Empowering Dodge: Apply +5% damage per stack of EmpoweringDodge status (max 10 stacks)
        val empoweringDodgeEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
            .filter { it.effectType == "EmpoweringDodge" }
        if (empoweringDodgeEffects.isNotEmpty()) {
            val totalStacks = empoweringDodgeEffects.sumOf { it.ammount }
            // Each stack = +5% damage (0.05 multiplier per stack, max 10 stacks = +50%)
            val empoweringDodgeMultiplier = 1.0 + (totalStacks * 0.05)
            modifiedDamage *= empoweringDodgeMultiplier
        }

        // Successive Parry: Apply +5% damage per stack of SuccessiveParry status
        val successiveParryEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
            .filter { it.effectType == "SuccessiveParry" }
        if (successiveParryEffects.isNotEmpty()) {
            val totalStacks = successiveParryEffects.sumOf { it.ammount }
            // Each stack = +5% damage (0.05 multiplier per stack)
            val successiveParryMultiplier = 1.0 + (totalStacks * 0.05)
            modifiedDamage *= successiveParryMultiplier
        }

        // Breaker: Apply +25% damage if target has Broken OR if target has Fragile and will become Broken
        val targetId = context["targetBattleCharacterId"] as? Int
        if (targetId != null) {
            val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
            if (character != null && character.characterType == "player") {
                val playerId = character.externalId.toIntOrNull()
                if (playerId != null) {
                    val pictos = playerPictoRepository.findByPlayerId(playerId)
                    val hasBreaker = pictos.any {
                        it.pictoId.lowercase() == "breaker" &&
                        it.slot != null &&
                        it.slot in 0..2
                    }

                    if (hasBreaker) {
                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                        val hasBroken = targetEffects.any { it.effectType == "Broken" }
                        val hasFragile = targetEffects.any { it.effectType == "Fragile" }
                        val willBreak = context["willApplyBroken"] as? Boolean ?: false

                        // +25% if target has Broken OR if target has Fragile and will become Broken
                        if (hasBroken || (hasFragile && willBreak)) {
                            modifiedDamage *= 1.25
                        }
                    }
                }
            }
        }

        // Breaking Burn: Apply +25% damage if target has Burning AND (Broken OR Fragile+willBreak)
        if (targetId != null) {
            val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
            if (character != null && character.characterType == "player") {
                val playerId = character.externalId.toIntOrNull()
                if (playerId != null) {
                    val pictos = playerPictoRepository.findByPlayerId(playerId)
                    val hasBreakingBurn = pictos.any {
                        it.pictoId.lowercase() == "breaking-burn" &&
                        it.slot != null &&
                        it.slot in 0..2
                    }

                    if (hasBreakingBurn) {
                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                        val hasBurning = targetEffects.any { it.effectType == "Burning" }
                        val hasBroken = targetEffects.any { it.effectType == "Broken" }
                        val hasFragile = targetEffects.any { it.effectType == "Fragile" }
                        val willBreak = context["willApplyBroken"] as? Boolean ?: false

                        // +25% ONLY if target has Burning AND (has Broken OR has Fragile and will become Broken)
                        if (hasBurning && (hasBroken || (hasFragile && willBreak))) {
                            modifiedDamage *= 1.25
                        }
                    }
                }
            }
        }

        // Enfeebling Mark: Reduce damage by 30% if attacker has Marked and target (defender) has enfeebling-mark picto
        if (targetId != null) {
            val targetCharacter = battleCharacterRepository.findById(targetId).orElse(null)
            if (targetCharacter != null && targetCharacter.characterType == "player") {
                val targetPlayerId = targetCharacter.externalId.toIntOrNull()
                if (targetPlayerId != null) {
                    val targetPictos = playerPictoRepository.findByPlayerId(targetPlayerId)
                    val hasEnfeeblingMark = targetPictos.any {
                        it.pictoId.lowercase() == "enfeebling-mark" &&
                        it.slot != null &&
                        it.slot in 0..2
                    }

                    if (hasEnfeeblingMark) {
                        // Check if attacker (source) has Marked status
                        val attackerEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
                        val attackerHasMarked = attackerEffects.any { it.effectType == "Marked" }

                        // -30% damage if attacker is Marked
                        if (attackerHasMarked) {
                            modifiedDamage *= 0.7  // 70% of original damage = 30% reduction
                        }
                    }
                }
            }
        }

        // Burn Affinity: Apply +25% damage if target has Burning
        if (targetId != null) {
            val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
            if (character != null && character.characterType == "player") {
                val playerId = character.externalId.toIntOrNull()
                if (playerId != null) {
                    val pictos = playerPictoRepository.findByPlayerId(playerId)
                    val hasBurnAffinity = pictos.any {
                        it.pictoId.lowercase() == "burn-affinity" &&
                        it.slot != null &&
                        it.slot in 0..2
                    }

                    if (hasBurnAffinity) {
                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                        val hasBurning = targetEffects.any { it.effectType == "Burning" }

                        if (hasBurning) {
                            modifiedDamage *= 1.25
                        }
                    }
                }
            }
        }

        // Teamwork: Apply +10% damage if all allies alive (not solo)
        val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
        if (character != null && character.characterType == "player") {
            val playerId = character.externalId.toIntOrNull()
            if (playerId != null) {
                val pictos = playerPictoRepository.findByPlayerId(playerId)
                val hasTeamwork = pictos.any {
                    it.pictoId.lowercase() == "teamwork" &&
                    it.slot != null &&
                    it.slot in 0..2
                }

                if (hasTeamwork) {
                    val isSolo = context["isSolo"] as? Boolean ?: true
                    if (!isSolo) {
                        val battleId = character.battleId
                        val allies = battleCharacterRepository
                            .findByBattleIdAndIsEnemy(battleId, character.isEnemy)
                            .filter { ally -> ally.id != battleCharacterId }

                        val allAlliesAlive = allies.all { ally -> ally.healthPoints > 0 }

                        if (allAlliesAlive) {
                            modifiedDamage *= 1.10
                        }
                    }
                }
            }
        }

        // Faster Than Strong: Apply -50% damage if DamageReduction status active
        val damageReductionEffects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
            .filter { it.effectType == "DamageReduction" }
        if (damageReductionEffects.isNotEmpty()) {
            val totalReduction = damageReductionEffects.sumOf { it.ammount }
            val reductionMultiplier = 1.0 - (totalReduction / 100.0)
            modifiedDamage *= reductionMultiplier
        }

        // Augmented Counter: +50% per equipped counter picto (stackable)
        if (attackType == "counter") {
            val character = battleCharacterRepository.findById(battleCharacterId).orElse(null)
            if (character != null && character.characterType == "player") {
                val playerId = character.externalId.toIntOrNull()
                if (playerId != null) {
                    val pictos = playerPictoRepository.findByPlayerId(playerId)
                    val counterPictos = pictos.filter {
                        it.pictoId.lowercase() in listOf(
                            "augmented-counter-i",
                            "augmented-counter-ii",
                            "augmented-counter-iii"
                        ) &&
                        it.slot != null &&
                        it.slot in 0..2
                    }

                    // Each counter picto = +50% (multiplicative, stackable)
                    counterPictos.forEach { _ ->
                        modifiedDamage *= 1.50
                    }
                }
            }
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
            "sniper-first-shot" -> {
                // Check if this is the first free-shot this turn (Sniper picto)
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null) ?: return false
                val battleId = character.battleId ?: return false

                // Check if Sniper was already used this turn
                val canActivate = pictoEffectTrackerService.canActivate(
                    battleId = battleId,
                    battleCharacterId = battleCharacterId,
                    pictoName = "sniper",
                    effectType = "once-per-turn"
                )

                canActivate
            }
            "versatile-buff" -> {
                // Check if character has VersatileBuff status effect (Versatile picto)
                val effects = battleStatusEffectRepository.findByBattleCharacterId(battleCharacterId)
                effects.any { it.effectType == "VersatileBuff" }
            }
            "enemy-fragile-or-broken" -> {
                // Check if target enemy has Fragile or Broken status (Breaking Shots picto)
                val targetId = context["targetBattleCharacterId"] as? Int ?: return false
                val effects = battleStatusEffectRepository.findByBattleCharacterId(targetId)
                effects.any { it.effectType == "Fragile" || it.effectType == "Broken" }
            }
            "first-hit-in-battle" -> {
                // Check if this is the first hit in battle (Augmented First Strike picto)
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null) ?: return false
                val battleId = character.battleId ?: return false

                // Check if this character has already attacked in this battle
                val canActivate = pictoEffectTrackerService.canActivate(
                    battleId = battleId,
                    battleCharacterId = battleCharacterId,
                    pictoName = "augmented-first-strike",
                    effectType = "once-per-battle"
                )

                canActivate
            }
            "has-mp" -> {
                // Check if character has MP available (Powered Attack picto)
                val character = battleCharacterRepository.findById(battleCharacterId).orElse(null) ?: return false
                val currentMP = character.magicPoints ?: 0
                currentMP > 0
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
