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
        private val elementResistanceService: com.example.demo.service.ElementResistanceService,
        private val playerPictoRepository: com.example.demo.repository.PlayerPictoRepository,
        private val pictoEffectTrackerService: com.example.demo.service.PictoEffectTrackerService,
        private val battleTurnService: com.example.demo.service.BattleTurnService,
        private val antiStatusService: com.example.demo.service.AntiStatusService
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

                        // Update MP using service to sync with Player table
                        battleCharacterService.updateCharacterMp(sourceBC.id!!, next)

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
                                // Only activate on the last hit of a skill to prevent bonus damage during the same skill
                                val sunCharges = sourceBC.sunCharges ?: 0
                                val moonCharges = sourceBC.moonCharges ?: 0
                                if (sunCharges >= 1 && moonCharges >= 1 && body.isLastHit == true) {
                                        // Activate Twilight: add status for 2 turns and reset charges
                                        battleStatusEffectRepository.save(
                                                BattleStatusEffect(
                                                        battleCharacterId = sourceBC.id!!,
                                                        effectType = "Twilight",
                                                        ammount = 0,
                                                        remainingTurns = 2,
                                                        isResolved = true,
                                                        sourceCharacterId = sourceBC.id
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

                        // Egide: Check if there's an ally with Guardian status to redirect damage
                        val battleId = targetBC.battleId
                        val allCharacters = battleCharacterRepository.findByBattleId(battleId)
                        val allies = allCharacters.filter { it.isEnemy == targetBC.isEnemy && it.id != targetBC.id }

                        // Find ally with Guardian status (Egide active)
                        val guardianAlly = allies.firstOrNull { ally ->
                                battleStatusEffectRepository
                                        .findByBattleCharacterIdAndEffectType(ally.id!!, "Guardian")
                                        .isNotEmpty()
                        }

                        // Redirect damage to guardian ally if exists
                        if (guardianAlly != null) {
                                targetBC = guardianAlly
                        }

                        // Apply damage modifiers from source character
                        // Check if this attack will apply Broken status (for Breaker picto)
                        val willApplyBroken = body.effects.any { it.effectType == "Broken" }

                        val modifierContext = mapOf(
                                "targetBattleCharacterId" to targetBC.id!!,
                                "isFirstHit" to (body.isFirstHit ?: false),
                                "isSolo" to (allies.isEmpty()),
                                "willApplyBroken" to willApplyBroken
                        )
                        var modifiedDamage = damageModifierService.calculateModifiedDamage(
                                battleCharacterId = body.sourceBattleId,
                                baseDamage = body.totalDamage,
                                attackType = body.attackType ?: "basic",
                                context = modifierContext
                        )

                        // Powered Attack: Consume 1 MP if modifier was applied (character has MP and Powered Attack equipped)
                        if (sourceBC.characterType == "player" && (sourceBC.magicPoints ?: 0) > 0) {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasPoweredAttack = pictos.any {
                                                it.pictoId.lowercase() == "powered-attack" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasPoweredAttack) {
                                                // Consume 1 MP for Powered Attack bonus
                                                val currentMP = sourceBC.magicPoints ?: 0
                                                val newMP = (currentMP - 1).coerceAtLeast(0)
                                                battleCharacterService.updateCharacterMp(sourceBC.id!!, newMP)
                                        }
                                }
                        }

                        // Augmented First Strike: Track usage if this is the first hit in battle
                        if (sourceBC.characterType == "player") {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasAugmentedFirstStrike = pictos.any {
                                                it.pictoId.lowercase() == "augmented-first-strike" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasAugmentedFirstStrike) {
                                                // Check if this is the first attack in battle
                                                val canActivate = pictoEffectTrackerService.canActivate(
                                                        battleId = battleId,
                                                        battleCharacterId = sourceBC.id!!,
                                                        pictoName = "augmented-first-strike",
                                                        effectType = "once-per-battle"
                                                )

                                                if (canActivate) {
                                                        // Track that first hit was used
                                                        pictoEffectTrackerService.track(
                                                                battleId = battleId,
                                                                battleCharacterId = sourceBC.id!!,
                                                                pictoName = "augmented-first-strike",
                                                                effectType = "once-per-battle"
                                                        )
                                                }
                                        }
                                }
                        }

                        // Sniper: Track usage if it's a free-shot and Sniper picto is equipped
                        var sniperWasActivated = false
                        if (body.attackType == "free-shot" && sourceBC.characterType == "player") {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasSniper = pictos.any {
                                                it.pictoId.lowercase() == "sniper" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasSniper) {
                                                // Check if this is the first free-shot this turn
                                                val canActivate = pictoEffectTrackerService.canActivate(
                                                        battleId = battleId,
                                                        battleCharacterId = sourceBC.id!!,
                                                        pictoName = "sniper",
                                                        effectType = "once-per-turn"
                                                )

                                                if (canActivate) {
                                                        // Track that Sniper was used
                                                        pictoEffectTrackerService.track(
                                                                battleId = battleId,
                                                                battleCharacterId = sourceBC.id!!,
                                                                pictoName = "sniper",
                                                                effectType = "once-per-turn"
                                                        )
                                                        sniperWasActivated = true
                                                }
                                        }
                                }
                        }

                        // Apply elemental resistances (if element is specified)
                        if (body.element != null) {
                                modifiedDamage = elementResistanceService.calculateElementalDamage(
                                        battleCharacterId = targetBC.id!!,
                                        baseDamage = modifiedDamage,
                                        element = body.element
                                )
                        }

                        // Breaking Rules: Destroy all shields BEFORE applying damage
                        if (body.destroysShields == true) {
                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                val shieldEffects = targetEffects.filter { it.effectType == "Shielded" }

                                // Count total shields (sum of all ammount values)
                                val shieldsDestroyed = shieldEffects.sumOf { it.ammount }

                                // Remove all shield effects
                                shieldEffects.forEach { shield ->
                                        battleStatusEffectRepository.delete(shield)
                                }

                                // Grant MP to source character (Maelle)
                                if (shieldsDestroyed > 0 && body.grantsAPPerShield != null) {
                                        val mpToGrant = shieldsDestroyed * body.grantsAPPerShield
                                        val currentMP = sourceBC.magicPoints ?: 0
                                        val maxMP = sourceBC.maxMagicPoints ?: 0
                                        val newMP = (currentMP + mpToGrant).coerceAtMost(maxMP)
                                        battleCharacterService.updateCharacterMp(sourceBC.id!!, newMP)

                                        // Log MP recovery
                                        battleLogRepository.save(
                                                BattleLog(
                                                        battleId = battleId,
                                                        eventType = "MP_RECOVERED",
                                                        eventJson = """{"characterId":${sourceBC.id},"amount":$mpToGrant,"shieldsDestroyed":$shieldsDestroyed}"""
                                                )
                                        )
                                }
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
                                battleCharacterService.updateCharacterHp(targetBC.id!!, 0)
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

                        // Empowering Parry & Empowering Dodge & Successive Parry: Remove all stacks when taking damage
                        if (body.totalDamage > 0 && targetBC.characterType == "player") {
                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)

                                // Remove all EmpoweringParry status effects
                                val empoweringParryEffects = targetEffects.filter { it.effectType == "EmpoweringParry" }
                                if (empoweringParryEffects.isNotEmpty()) {
                                        empoweringParryEffects.forEach { effect ->
                                                battleStatusEffectRepository.delete(effect)
                                        }
                                }

                                // Remove all EmpoweringDodge status effects
                                val empoweringDodgeEffects = targetEffects.filter { it.effectType == "EmpoweringDodge" }
                                if (empoweringDodgeEffects.isNotEmpty()) {
                                        empoweringDodgeEffects.forEach { effect ->
                                                battleStatusEffectRepository.delete(effect)
                                        }
                                }

                                // Remove all SuccessiveParry status effects
                                val successiveParryEffects = targetEffects.filter { it.effectType == "SuccessiveParry" }
                                if (successiveParryEffects.isNotEmpty()) {
                                        successiveParryEffects.forEach { effect ->
                                                battleStatusEffectRepository.delete(effect)
                                        }
                                }
                        }

                        // Check if attack should ignore shields (Piercing Shot picto with free-shot)
                        val shouldIgnoreShields = if (body.attackType == "free-shot" && sourceBC.characterType == "player") {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        pictos.any {
                                                it.pictoId.lowercase() == "piercing-shot" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }
                                } else {
                                        false
                                }
                        } else {
                                false
                        }

                        // Normal shield consumption (only 1) - unless ignoring shields (Piercing Shot) or destroying all shields (Breaking Rules)
                        if (body.destroysShields != true && !shouldIgnoreShields) {
                                battleService.consumeShield(targetBC.id!!)
                        }
                        // If shouldIgnoreShields is true, shield is NOT consumed (Piercing Shot effect)

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

                        // Sniper: Convert Fragile to Broken if Sniper was activated
                        if (sniperWasActivated) {
                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                val fragileEffect = targetEffects.firstOrNull { it.effectType == "Fragile" }

                                if (fragileEffect != null) {
                                        // Remove Fragile effect
                                        battleStatusEffectRepository.delete(fragileEffect)

                                        // Add Broken effect (1 turn)
                                        val brokenEffect = com.example.demo.model.BattleStatusEffect(
                                                battleCharacterId = targetBC.id!!,
                                                effectType = "Broken",
                                                ammount = 1,
                                                remainingTurns = 1,
                                                isResolved = true,
                                                skipNextDecrement = false,
                                                sourceCharacterId = body.sourceBattleId
                                        )
                                        battleStatusEffectRepository.save(brokenEffect)

                                        battleLogRepository.save(
                                                BattleLog(
                                                        battleId = battleId,
                                                        eventType = "SNIPER_BREAK",
                                                        eventJson = null
                                                )
                                        )

                                        // Quick Break: Grant extra turn if player has quick-break picto
                                        checkQuickBreakAndGrantExtraTurn(sourceBC, battleId)

                                        // Fueling Break: Double Burn stacks if player has fueling-break picto
                                        checkFuelingBreakAndDoubleBurn(sourceBC, targetBC, battleId)
                                }
                        }

                        // Breaking Shots: Convert Fragile to Broken if Breaking Shots picto is equipped and attack is free-shot
                        if (body.attackType == "free-shot" && sourceBC.characterType == "player") {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasBreakingShots = pictos.any {
                                                it.pictoId.lowercase() == "breaking-shots" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasBreakingShots) {
                                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                                val fragileEffect = targetEffects.firstOrNull { it.effectType == "Fragile" }

                                                if (fragileEffect != null) {
                                                        // Remove Fragile effect
                                                        battleStatusEffectRepository.delete(fragileEffect)

                                                        // Add Broken effect (1 turn)
                                                        val brokenEffect = com.example.demo.model.BattleStatusEffect(
                                                                battleCharacterId = targetBC.id!!,
                                                                effectType = "Broken",
                                                                ammount = 1,
                                                                remainingTurns = 1,
                                                                isResolved = true,
                                                                skipNextDecrement = false,
                                                                sourceCharacterId = body.sourceBattleId
                                                        )
                                                        battleStatusEffectRepository.save(brokenEffect)

                                                        battleLogRepository.save(
                                                                BattleLog(
                                                                        battleId = battleId,
                                                                        eventType = "BREAKING_SHOTS_BREAK",
                                                                        eventJson = null
                                                                )
                                                        )

                                                        // Quick Break: Grant extra turn if player has quick-break picto
                                                        checkQuickBreakAndGrantExtraTurn(sourceBC, battleId)

                                                        // Fueling Break: Double Burn stacks if player has fueling-break picto
                                                        checkFuelingBreakAndDoubleBurn(sourceBC, targetBC, battleId)
                                                }
                                        }
                                }
                        }

                        // Breaking Attack: Convert Fragile to Broken if Breaking Attack picto is equipped and attack is basic
                        if (body.attackType == "basic" && sourceBC.characterType == "player" && body.totalDamage != null && body.totalDamage > 0) {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasBreakingAttack = pictos.any {
                                                it.pictoId.lowercase() == "breaking-attack" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasBreakingAttack) {
                                                val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                                                val fragileEffect = targetEffects.firstOrNull { it.effectType == "Fragile" }

                                                if (fragileEffect != null) {
                                                        // Remove Fragile effect
                                                        battleStatusEffectRepository.delete(fragileEffect)

                                                        // Add Broken effect (1 turn)
                                                        val brokenEffect = com.example.demo.model.BattleStatusEffect(
                                                                battleCharacterId = targetBC.id!!,
                                                                effectType = "Broken",
                                                                ammount = 1,
                                                                remainingTurns = 1,
                                                                isResolved = true,
                                                                skipNextDecrement = false,
                                                                sourceCharacterId = body.sourceBattleId
                                                        )
                                                        battleStatusEffectRepository.save(brokenEffect)

                                                        battleLogRepository.save(
                                                                BattleLog(
                                                                        battleId = battleId,
                                                                        eventType = "BREAKING_ATTACK_BREAK",
                                                                        eventJson = null
                                                                )
                                                        )

                                                        // Quick Break: Grant extra turn if player has quick-break picto
                                                        checkQuickBreakAndGrantExtraTurn(sourceBC, battleId)

                                                        // Fueling Break: Double Burn stacks if player has fueling-break picto
                                                        checkFuelingBreakAndDoubleBurn(sourceBC, targetBC, battleId)
                                                }
                                        }
                                }
                        }

                        // Charging Attack: Increase gradient bar by 15% (5 points) on basic attacks
                        if (body.attackType == "basic" && sourceBC.characterType == "player") {
                                val playerId = sourceBC.externalId.toIntOrNull()
                                if (playerId != null) {
                                        val pictos = playerPictoRepository.findByPlayerId(playerId)
                                        val hasChargingAttack = pictos.any {
                                                it.pictoId.lowercase() == "charging-attack" &&
                                                it.slot != null &&
                                                it.slot in 0..2
                                        }

                                        if (hasChargingAttack) {
                                                val battle = battleRepository.findById(sourceBC.battleId).orElse(null)
                                                if (battle != null) {
                                                        // 15% of max gradient (36) = 5.4 ≈ 5 points
                                                        val gradientBonus = 5
                                                        val maxGradient = 36  // 3 charges * 12 points per charge

                                                        if (sourceBC.isEnemy) {
                                                                val currentGradient = battle.teamBGradientPoints
                                                                battle.teamBGradientPoints = (currentGradient + gradientBonus).coerceAtMost(maxGradient)
                                                        } else {
                                                                val currentGradient = battle.teamAGradientPoints
                                                                battle.teamAGradientPoints = (currentGradient + gradientBonus).coerceAtMost(maxGradient)
                                                        }

                                                        battleRepository.save(battle)
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

                        // Remove Marked status unless explicitly disabled (e.g., for Gustave's Homage)
                        if (body.shouldRemoveMarked != false) {
                                battleService.removeMarked(targetBC.id!!)
                        }

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
                                                        remainingTurns = eff.remainingTurns,
                                                        sourceCharacterId = body.sourceBattleId
                                                )
                                        )

                                        // Check anti-status protection
                                        antiStatusService.checkAndRemoveStatus(
                                                targetBC.id!!,
                                                eff.effectType
                                        )
                                }
                                }

                        // Longer Rush: Extend Hastened duration by 2 turns if target has longer-rush picto
                        val hastenedEffects = body.effects.filter { it.effectType == "Hastened" }
                        if (hastenedEffects.isNotEmpty()) {
                                if (targetBC.characterType == "player") {
                                        val targetPlayerId = targetBC.externalId.toIntOrNull()
                                        if (targetPlayerId != null) {
                                                val targetPictos = playerPictoRepository.findByPlayerId(targetPlayerId)
                                                val hasLongerRush = targetPictos.any {
                                                        it.pictoId.lowercase() == "longer-rush" &&
                                                        it.slot != null &&
                                                        it.slot in 0..2
                                                }

                                                if (hasLongerRush) {
                                                        val targetHastenedEffects = battleStatusEffectRepository
                                                                .findByBattleCharacterId(targetBC.id!!)
                                                                .filter { it.effectType == "Hastened" }

                                                        targetHastenedEffects.forEach { effect ->
                                                                val newTurns = (effect.remainingTurns ?: 0) + 2
                                                                battleStatusEffectRepository.save(
                                                                        effect.copy(remainingTurns = newTurns)
                                                                )
                                                        }
                                                }
                                        }
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
                                        existing?.copy(ammount = next, sourceCharacterId = existing.sourceCharacterId ?: body.sourceBattleId)
                                                ?: BattleStatusEffect(
                                                        battleCharacterId = targetBC.id!!,
                                                        effectType = "free-shot",
                                                        ammount = next,
                                                        sourceCharacterId = body.sourceBattleId
                                                )

                                battleStatusEffectRepository.save(toSave)
                        }
                }

                // Versatile: Apply buff after successful free-shot
                if (body.attackType == "free-shot" && sourceBC.characterType == "player" && body.totalDamage != null && body.totalDamage > 0) {
                        val playerId = sourceBC.externalId.toIntOrNull()
                        if (playerId != null) {
                                val pictos = playerPictoRepository.findByPlayerId(playerId)
                                val hasVersatile = pictos.any {
                                        it.pictoId.lowercase() == "versatile" &&
                                        it.slot != null &&
                                        it.slot in 0..2
                                }

                                if (hasVersatile) {
                                        // Add VersatileBuff status effect (lasts 1 turn)
                                        val existingBuff = battleStatusEffectRepository
                                                .findByBattleCharacterIdAndEffectType(sourceBC.id!!, "VersatileBuff")
                                                .firstOrNull()

                                        if (existingBuff == null) {
                                                val versatileBuff = BattleStatusEffect(
                                                        battleCharacterId = sourceBC.id!!,
                                                        effectType = "VersatileBuff",
                                                        ammount = 1,
                                                        remainingTurns = 1,
                                                        isResolved = true,
                                                        skipNextDecrement = false,
                                                        sourceCharacterId = sourceBC.id
                                                )
                                                battleStatusEffectRepository.save(versatileBuff)

                                                val sourceBattleId = sourceBC.battleId
                                                if (sourceBattleId != null) {
                                                        battleLogRepository.save(
                                                                BattleLog(
                                                                        battleId = sourceBattleId,
                                                                        eventType = "VERSATILE_BUFF_APPLIED",
                                                                        eventJson = null
                                                                )
                                                        )
                                                }
                                        }
                                }
                        }
                }

                // Combo Attack: Process extra hits if this is a base attack
                if (body.attackType == "basic" && body.isFirstHit == true && body.totalDamage != null) {
                        val extraHits = battleCharacterService.calculateExtraBaseAttackHits(body.sourceBattleId)

                        if (extraHits > 0) {
                                // Process each extra hit
                                for (hitIndex in 1..extraHits) {
                                        // Recursive call for each extra hit (without isFirstHit flag)
                                        val extraHitRequest = CreateAttackRequest(
                                                totalDamage = body.totalDamage,
                                                totalPower = body.totalPower,
                                                targetBattleId = body.targetBattleId,
                                                sourceBattleId = body.sourceBattleId,
                                                effects = emptyList(), // No status effects on extra hits
                                                attackType = "basic",
                                                skillCost = 0, // No MP cost for extra hits
                                                consumesCharge = null,
                                                isGradient = body.isGradient,
                                                destroysShields = null, // Extra hits don't destroy shields
                                                grantsAPPerShield = null,
                                                consumesBurn = null,
                                                consumesForetell = null,
                                                executionThreshold = null,
                                                skillType = null,
                                                bestialWheelAdvance = null,
                                                isFirstHit = false, // NOT the first hit
                                                element = body.element
                                        )

                                        // Process extra hit recursively
                                        addAttack(extraHitRequest)
                                }
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

        /**
         * Quick Break Helper: Checks if player has quick-break picto and grants extra turn
         * Called when Broken status is successfully applied to an enemy
         */
        private fun checkQuickBreakAndGrantExtraTurn(sourceBC: com.example.demo.model.BattleCharacter, battleId: Int) {
                if (sourceBC.characterType != "player") return

                val playerId = sourceBC.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)
                val hasQuickBreak = pictos.any {
                        it.pictoId.lowercase() == "quick-break" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasQuickBreak) {
                        // Grant extra turn by moving character to position 2 (next turn)
                        battleTurnService.grantExtraTurn(battleId, sourceBC.id!!)

                        battleLogRepository.save(
                                BattleLog(
                                        battleId = battleId,
                                        eventType = "QUICK_BREAK_EXTRA_TURN",
                                        eventJson = null
                                )
                        )
                }
        }

        /**
         * Fueling Break Helper: Checks if player has fueling-break picto and doubles Burn stacks
         * Called when Broken status is successfully applied to an enemy
         */
        private fun checkFuelingBreakAndDoubleBurn(sourceBC: com.example.demo.model.BattleCharacter, targetBC: com.example.demo.model.BattleCharacter, battleId: Int) {
                if (sourceBC.characterType != "player") return

                val playerId = sourceBC.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)
                val hasFuelingBreak = pictos.any {
                        it.pictoId.lowercase() == "fueling-break" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasFuelingBreak) {
                        // Find all Burning status effects on target
                        val targetEffects = battleStatusEffectRepository.findByBattleCharacterId(targetBC.id!!)
                        val burningEffects = targetEffects.filter { it.effectType == "Burning" }

                        if (burningEffects.isNotEmpty()) {
                                burningEffects.forEach { burnEffect ->
                                        // Double the burn amount
                                        val doubledAmount = burnEffect.ammount * 2
                                        val updatedEffect = burnEffect.copy(ammount = doubledAmount)
                                        battleStatusEffectRepository.save(updatedEffect)
                                }

                                battleLogRepository.save(
                                        BattleLog(
                                                battleId = battleId,
                                                eventType = "FUELING_BREAK_BURN_DOUBLED",
                                                eventJson = null
                                        )
                                )
                        }
                }
        }
}
