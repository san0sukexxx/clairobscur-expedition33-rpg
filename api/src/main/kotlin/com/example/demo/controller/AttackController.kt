package com.example.demo.controller

import com.example.demo.dto.AttackStatusEffectResponse
import com.example.demo.dto.CreateAttackRequest
import com.example.demo.dto.GetAttacksResponse
import com.example.demo.dto.StatusEffectRequest
import com.example.demo.model.Attack
import com.example.demo.model.AttackStatusEffect
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleStatusEffect
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.AttackStatusEffectRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.service.BattleService
import com.example.demo.service.DamageService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attacks")
class AttackController(
        private val attackRepository: AttackRepository,
        private val attackStatusEffectRepository: AttackStatusEffectRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleRepository: BattleRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleService: BattleService,
        private val damageService: DamageService,
        private val battleCharacterService: com.example.demo.service.BattleCharacterService,
        private val damageModifierService: com.example.demo.service.DamageModifierService,
        private val elementResistanceService: com.example.demo.service.ElementResistanceService
) {

        @PostMapping
        @Transactional
        fun addAttack(@RequestBody body: CreateAttackRequest): ResponseEntity<Void> {

                val sourceBC =
                        battleCharacterRepository.findById(body.sourceBattleId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

                if (sourceBC.characterType == "player") {
                        val exhausted =
                                battleStatusEffectRepository
                                        .findByBattleCharacterIdAndEffectType(
                                                sourceBC.id!!,
                                                "Exhausted"
                                        )
                                        .isNotEmpty()

                        val freeShotCost = if (exhausted) 2 else 1

                        val current = sourceBC.magicPoints ?: 0
                        val max = sourceBC.maxMagicPoints ?: 0

                        // Handle Gradient skills separately (they don't use MP)
                        val next = if (body.isGradient == true) {
                                // Gradient skills don't consume MP
                                current
                        } else {
                                when (body.attackType) {
                                        "basic" -> (current + 1).coerceAtMost(max)
                                        "free-shot" -> (current - freeShotCost).coerceAtLeast(0)
                                        "skill" -> {
                                                val cost = body.skillCost ?: 0
                                                (current - cost).coerceAtLeast(0)
                                        }
                                        else -> current
                                }
                        }

                        sourceBC.magicPoints = next

                        // Verso's Perfection Rank: Increase rankProgress based on action type
                        if (sourceBC.characterType == "player" &&
                            sourceBC.externalId.contains("verso", ignoreCase = true)) {
                                val currentProgress = sourceBC.rankProgress ?: 0
                                val currentRank = sourceBC.perfectionRank ?: "D"

                                // Calculate progress increase based on action type
                                val progressIncrease = when (body.attackType) {
                                        "basic" -> 20      // Basic attack: +20%
                                        "free-shot" -> 10  // Free shot: +10%
                                        "skill" -> 40      // Skill: +40%
                                        else -> 0
                                }

                                val newProgress = currentProgress + progressIncrease

                                // Check if rank up is needed (progress >= 100)
                                if (newProgress >= 100 && currentRank != "S") {
                                        // Rank up automatically
                                        battleCharacterService.rankUpCharacter(sourceBC.id!!)

                                        // Reload character to get updated rank
                                        val updatedSourceBC = battleCharacterRepository.findById(sourceBC.id!!).orElse(sourceBC)

                                        // Set remaining progress (overflow) after rank up
                                        val remainingProgress = newProgress - 100
                                        updatedSourceBC.rankProgress = remainingProgress
                                        battleCharacterRepository.save(updatedSourceBC)
                                } else {
                                        // Just update progress
                                        sourceBC.rankProgress = newProgress
                                }
                        }

                        // Charge system logic (Gustave)
                        if (body.consumesCharge == true) {
                                // Overcharge or other skill that consumes all charges
                                sourceBC.chargePoints = 0
                        } else {
                                // All actions increment charge (+1), including each hit of multi-hit skills
                                val currentCharge = sourceBC.chargePoints ?: 0
                                val maxCharge = sourceBC.maxChargePoints ?: 0
                                if (maxCharge > 0) {
                                        sourceBC.chargePoints = (currentCharge + 1).coerceAtMost(maxCharge)
                                }
                        }

                        // Sun/Moon charge system logic (Sciel)
                        // Check if character has Twilight status - if so, don't gain charges
                        val hasTwilight = battleStatusEffectRepository
                                .findByBattleCharacterIdAndEffectType(sourceBC.id!!, "Twilight")
                                .isNotEmpty()

                        if (!hasTwilight && body.skillType != null) {
                                when (body.skillType.lowercase()) {
                                        "sun" -> {
                                                val currentSun = sourceBC.sunCharges ?: 0
                                                sourceBC.sunCharges = (currentSun + 1).coerceAtMost(20)
                                        }
                                        "moon" -> {
                                                val currentMoon = sourceBC.moonCharges ?: 0
                                                sourceBC.moonCharges = (currentMoon + 1).coerceAtMost(20)
                                        }
                                }

                                // Check for Twilight activation (needs at least 1 Sun AND 1 Moon charge)
                                val sunCharges = sourceBC.sunCharges ?: 0
                                val moonCharges = sourceBC.moonCharges ?: 0
                                if (sunCharges >= 1 && moonCharges >= 1) {
                                        // Activate Twilight: add status for 2 turns and reset charges
                                        battleStatusEffectRepository.save(
                                                BattleStatusEffect(
                                                        battleCharacterId = sourceBC.id!!,
                                                        effectType = "Twilight",
                                                        ammount = 0,
                                                        remainingTurns = 2
                                                )
                                        )
                                        // Reset sun and moon charges
                                        sourceBC.sunCharges = 0
                                        sourceBC.moonCharges = 0
                                }
                        }

                        // Gradient system logic (team-based)
                        val battle = battleRepository.findById(sourceBC.battleId).orElse(null)
                        if (battle != null) {
                                if (body.isGradient == true) {
                                        // Gradient skills consume gradient charges from team (skillCost * 12 points per charge)
                                        val gradientCost = (body.skillCost ?: 1) * 12
                                        if (sourceBC.isEnemy) {
                                                val currentGradient = battle.teamBGradientPoints
                                                battle.teamBGradientPoints = (currentGradient - gradientCost).coerceAtLeast(0)
                                        } else {
                                                val currentGradient = battle.teamAGradientPoints
                                                battle.teamAGradientPoints = (currentGradient - gradientCost).coerceAtLeast(0)
                                        }
                                } else if (body.attackType == "skill" && body.skillCost != null && body.skillCost > 0) {
                                        // Using skills with MP cost charges gradient bar (MP cost = gradient points gained)
                                        // Max gradient points = 36 (3 charges * 12 points each)
                                        val maxGradient = 36  // 3 charges * 12 points per charge
                                        if (sourceBC.isEnemy) {
                                                val currentGradient = battle.teamBGradientPoints
                                                battle.teamBGradientPoints = (currentGradient + body.skillCost).coerceAtMost(maxGradient)
                                        } else {
                                                val currentGradient = battle.teamAGradientPoints
                                                battle.teamAGradientPoints = (currentGradient + body.skillCost).coerceAtMost(maxGradient)
                                        }
                                }
                                battleRepository.save(battle)
                        }

                        // Bestial Wheel advancement (Monoco)
                        if (body.bestialWheelAdvance != null && body.bestialWheelAdvance > 0) {
                                val currentPosition = sourceBC.bestialWheelPosition ?: 0
                                val wheelSize = 9  // Pattern size: gold, blue, blue, purple, purple, red, red, green, green

                                // For gradient skills, always set to gold (position 0)
                                if (body.isGradient == true) {
                                        sourceBC.bestialWheelPosition = 0
                                } else {
                                        // Advance by specified amount and wrap around
                                        val newPosition = (currentPosition + body.bestialWheelAdvance) % wheelSize
                                        sourceBC.bestialWheelPosition = newPosition
                                }
                        }

                        battleCharacterRepository.save(sourceBC)
                }

                if (body.totalPower != null) {
                        val attack =
                                attackRepository.save(
                                        Attack(
                                                battleId = sourceBC.battleId,
                                                totalPower = body.totalPower,
                                                targetBattleId = body.targetBattleId,
                                                sourceBattleId = body.sourceBattleId,
                                                isResolved = false
                                        )
                                )

                        body.effects.forEach { eff: StatusEffectRequest ->
                                attackStatusEffectRepository.save(
                                        AttackStatusEffect(
                                                attackId = attack.id!!,
                                                effectType = eff.effectType,
                                                ammount = eff.ammount ?: 0,
                                                remainingTurns = eff.remainingTurns
                                        )
                                )
                        }

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = sourceBC.battleId,
                                        eventType = "ATTACK_PENDING",
                                        eventJson = null
                                )
                        )
                } else if (body.totalDamage != null) {
                        var targetBC =
                                battleCharacterRepository.findById(body.targetBattleId).orElse(null)
                                        ?: return ResponseEntity.badRequest().build()

                        // Egide: Check if there's an ally with Taunt status to redirect damage
                        val battleId = targetBC.battleId
                        val allCharacters = battleCharacterRepository.findByBattleId(battleId)
                        val allies = allCharacters.filter { it.isEnemy == targetBC.isEnemy && it.id != targetBC.id }

                        // Find ally with Taunt status (Egide active)
                        val tauntingAlly = allies.firstOrNull { ally ->
                                battleStatusEffectRepository
                                        .findByBattleCharacterIdAndEffectType(ally.id!!, "Taunt")
                                        .isNotEmpty()
                        }

                        // Redirect damage to taunting ally if exists
                        if (tauntingAlly != null) {
                                targetBC = tauntingAlly
                        }

                        // Apply damage modifiers from source character
                        val modifierContext = mapOf(
                                "targetBattleCharacterId" to targetBC.id!!,
                                "isFirstHit" to (body.isFirstHit ?: false),
                                "isSolo" to (allies.isEmpty())
                        )
                        var modifiedDamage = damageModifierService.calculateModifiedDamage(
                                battleCharacterId = body.sourceBattleId,
                                baseDamage = body.totalDamage,
                                attackType = body.attackType ?: "basic",
                                context = modifierContext
                        )

                        // Apply elemental resistances (if element is specified)
                        if (body.element != null) {
                                modifiedDamage = elementResistanceService.calculateElementalDamage(
                                        battleCharacterId = targetBC.id!!,
                                        baseDamage = modifiedDamage,
                                        element = body.element
                                )
                        }

                        // Gommage: Check for execution threshold (instant kill if HP% <= threshold)
                        val shouldExecute = if (body.executionThreshold != null) {
                                val currentHpPercent = (targetBC.healthPoints.toDouble() / targetBC.maxHealthPoints.toDouble()) * 100
                                currentHpPercent <= body.executionThreshold
                        } else {
                                false
                        }

                        // Execute instantly if below threshold, otherwise apply modified damage
                        val newHp = if (shouldExecute) {
                                // Instant execution - set HP to 0
                                targetBC.healthPoints = 0
                                battleCharacterRepository.save(targetBC)
                                0
                        } else {
                                damageService.applyDamage(targetBC, modifiedDamage)
                        }

                        // Verso's Perfection Rank: Rank down when receiving damage
                        if (body.totalDamage > 0 &&
                            targetBC.characterType == "player" &&
                            targetBC.externalId.contains("verso", ignoreCase = true)) {
                                // Verso took damage, rank down
                                battleCharacterService.rankDownCharacter(targetBC.id!!)
                        }

                        // Breaking Rules: Destroy all shields and grant AP
                        if (body.destroysShields == true) {
                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                val shieldEffects = targetEffects.filter { it.effectType == "Shielded" }
                                val shieldsDestroyed = shieldEffects.size

                                // Remove all shield effects
                                shieldEffects.forEach { shield ->
                                        battleStatusEffectRepository.delete(shield)
                                }

                                // Grant AP to source character (Maelle)
                                if (shieldsDestroyed > 0 && body.grantsAPPerShield != null) {
                                        val apToGrant = shieldsDestroyed * body.grantsAPPerShield
                                        val currentMP = sourceBC.magicPoints ?: 0
                                        val maxMP = sourceBC.maxMagicPoints ?: 0
                                        sourceBC.magicPoints = (currentMP + apToGrant).coerceAtMost(maxMP)
                                        battleCharacterRepository.save(sourceBC)
                                }
                        } else {
                                // Normal shield consumption (only 1)
                                battleService.consumeShield(targetBC.id!!)
                        }

                        // Combustion: Consume Burn stacks from target
                        body.consumesBurn?.let { consumeAmount ->
                                if (consumeAmount > 0) {
                                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                        val burnEffects = targetEffects.filter { it.effectType == "Burning" }

                                        var burnsRemaining: Int = consumeAmount
                                        for (burn in burnEffects) {
                                                if (burnsRemaining > 0) {
                                                        val burnAmount = burn.ammount
                                                        if (burnAmount <= burnsRemaining) {
                                                                // Remove entire burn effect
                                                                battleStatusEffectRepository.delete(burn)
                                                                burnsRemaining -= burnAmount
                                                        } else {
                                                                // Reduce burn amount
                                                                battleStatusEffectRepository.save(
                                                                        burn.copy(ammount = burnAmount - burnsRemaining)
                                                                )
                                                                burnsRemaining = 0
                                                        }
                                                }
                                        }
                                }
                        }

                        // Twilight Slash: Consume Foretell stacks from target
                        body.consumesForetell?.let { consumeAmount ->
                                if (consumeAmount > 0) {
                                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                        val foretellEffects = targetEffects.filter { it.effectType == "Foretell" }

                                        var foretellsRemaining: Int = consumeAmount
                                        for (foretell in foretellEffects) {
                                                if (foretellsRemaining > 0) {
                                                        val foretellAmount = foretell.ammount
                                                        if (foretellAmount <= foretellsRemaining) {
                                                                // Remove entire foretell effect
                                                                battleStatusEffectRepository.delete(foretell)
                                                                foretellsRemaining -= foretellAmount
                                                        } else {
                                                                // Reduce foretell amount
                                                                battleStatusEffectRepository.save(
                                                                        foretell.copy(ammount = foretellAmount - foretellsRemaining)
                                                                )
                                                                foretellsRemaining = 0
                                                        }
                                                }
                                        }
                                }
                        }

                        battleService.removeMarked(targetBC.id!!)

                        val nonStackableEffects = listOf("Fragile", "Inverted", "Flying", "Dizzy", "Stunned", "Silenced", "Exhausted")

                        if (newHp > 0) {
                                body.effects.forEach { eff ->
                                val allTargetEffects = battleStatusEffectRepository
                                        .findByBattleCharacterId(targetBC.id!!)

                                val existing = allTargetEffects.firstOrNull { it.effectType == eff.effectType }

                                if (eff.effectType == "Fragile") {
                                        val hasBroken = allTargetEffects.any { it.effectType == "Broken" }
                                        if (hasBroken) {
                                                return@forEach
                                        }
                                }

                                if (existing != null && nonStackableEffects.contains(eff.effectType)) {
                                        return@forEach
                                }

                                if (existing != null) {
                                        var nextAmount = (existing.ammount) + (eff.ammount ?: 0)

                                        // Foretell cap: 20 normally, 40 if target has Twilight status
                                        if (eff.effectType == "Foretell") {
                                                val targetHasTwilight = allTargetEffects.any { it.effectType == "Twilight" }
                                                val foretellCap = if (targetHasTwilight) 40 else 20
                                                nextAmount = nextAmount.coerceAtMost(foretellCap)
                                        }

                                        val nextTurns = eff.remainingTurns ?: existing.remainingTurns
                                        battleStatusEffectRepository.save(
                                                existing.copy(
                                                        ammount = nextAmount,
                                                        remainingTurns = nextTurns
                                                )
                                        )
                                } else {
                                        var amount = eff.ammount ?: 0

                                        // Foretell cap: 20 normally, 40 if target has Twilight status
                                        if (eff.effectType == "Foretell") {
                                                val targetHasTwilight = allTargetEffects.any { it.effectType == "Twilight" }
                                                val foretellCap = if (targetHasTwilight) 40 else 20
                                                amount = amount.coerceAtMost(foretellCap)
                                        }

                                        battleStatusEffectRepository.save(
                                                BattleStatusEffect(
                                                        battleCharacterId = targetBC.id!!,
                                                        effectType = eff.effectType,
                                                        ammount = amount,
                                                        remainingTurns = eff.remainingTurns
                                                )
                                        )
                                }
                                }
                        }

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = targetBC.battleId,
                                        eventType = "DAMAGE_DEALT",
                                        eventJson = null
                                )
                        )

                        if (body.attackType == "free-shot" && newHp > 0) {
                                val effects =
                                        battleStatusEffectRepository.findByBattleCharacterId(
                                                targetBC.id!!
                                        )
                                val existing = effects.firstOrNull { it.effectType == "free-shot" }
                                val next = (existing?.ammount ?: 0) + 1

                                val toSave =
                                        existing?.copy(ammount = next)
                                                ?: BattleStatusEffect(
                                                        battleCharacterId = targetBC.id!!,
                                                        effectType = "free-shot",
                                                        ammount = next
                                                )

                                battleStatusEffectRepository.save(toSave)
                        }
                }

                return ResponseEntity.noContent().build()
        }

        @GetMapping("/pending/{battleId}")
        fun getPendingAttacks(
                @PathVariable battleId: Int
        ): ResponseEntity<List<GetAttacksResponse>> {
                val attacks = attackRepository.findByBattleIdAndIsResolvedFalse(battleId)
                if (attacks.isEmpty()) return ResponseEntity.ok(emptyList())

                val attackIds = attacks.mapNotNull { it.id }
                val allEffects = attackStatusEffectRepository.findByAttackIdIn(attackIds)
                val effectsByAttackId = allEffects.groupBy { it.attackId }

                val response =
                        attacks.map { attack ->
                                val effects = effectsByAttackId[attack.id] ?: emptyList()
                                GetAttacksResponse(
                                        id = attack.id!!,
                                        battleId = attack.battleId,
                                        totalPower = attack.totalPower,
                                        targetBattleId = attack.targetBattleId,
                                        sourceBattleId = attack.sourceBattleId,
                                        isResolved = attack.isResolved,
                                        effects =
                                                effects.map {
                                                        AttackStatusEffectResponse(
                                                                id = it.id!!,
                                                                effectType = it.effectType,
                                                                ammount = it.ammount,
                                                                remainingTurns = it.remainingTurns
                                                        )
                                                }
                                )
                        }

                return ResponseEntity.ok(response)
        }

        @PostMapping("/{battleId}/allow-counter")
        fun allowCounterForAll(@PathVariable battleId: Int): ResponseEntity<Void> {
                val attacks = attackRepository.findByBattleId(battleId)
                attacks.forEach { it.allowCounter = true }
                attackRepository.saveAll(attacks)

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "ALLOW_COUNTER",
                                eventJson = null
                        )
                )

                return ResponseEntity.ok().build()
        }
}
