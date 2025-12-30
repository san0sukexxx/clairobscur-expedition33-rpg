package com.example.demo.service

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.model.BattleCharacter
import com.example.demo.model.BattleInitiative
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleInitiativeRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleTurnRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleCharacterService(
        private val repository: BattleCharacterRepository,
        private val initiativeRepository: BattleInitiativeRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleTurnService: BattleTurnService,
        private val battleRepository: BattleRepository,
        private val objectMapper: ObjectMapper,
        private val playerPictoRepository: com.example.demo.repository.PlayerPictoRepository,
        private val damageModifierService: DamageModifierService
) {
        @Transactional
        fun addCharacter(battleId: Int, request: AddBattleCharacterRequest): Int {
                val battle =
                        battleRepository.findById(battleId).orElseThrow {
                                IllegalArgumentException("Battle $battleId not found")
                        }

                val isBattleStarted = battle.battleStatus.equals("started", ignoreCase = true)
                val isEnemy = request.team.equals("B", ignoreCase = true)

                val entity =
                        BattleCharacter(
                                battleId = battleId,
                                externalId = request.externalId,
                                characterName = request.characterName,
                                characterType = request.characterType,
                                isEnemy = isEnemy,
                                healthPoints = request.healthPoints,
                                maxHealthPoints = request.maxHealthPoints,
                                magicPoints = request.magicPoints,
                                maxMagicPoints = request.maxMagicPoints,
                                chargePoints = request.chargePoints ?: 0,
                                maxChargePoints = request.maxChargePoints,
                                sunCharges = request.sunCharges ?: 0,
                                moonCharges = request.moonCharges ?: 0,
                                stance = request.stance,
                                stainSlot1 = request.stainSlot1,
                                stainSlot2 = request.stainSlot2,
                                stainSlot3 = request.stainSlot3,
                                stainSlot4 = request.stainSlot4,
                                perfectionRank = request.perfectionRank,
                                rankProgress = request.rankProgress,
                                bestialWheelPosition = request.bestialWheelPosition ?: 0,
                                canRollInitiative = request.canRollInitiative
                        )

                val savedCharacter = repository.save(entity)

                // Check for Solo Fighter picto and add damage modifier
                checkAndApplySoloFighterModifier(savedCharacter)

                // Check for Last Stand Critical picto and add critical modifier
                checkAndApplyLastStandCriticalModifier(savedCharacter)

                // Check for Augmented Aim picto and add free-aim damage modifier
                checkAndApplyAugmentedAimModifier(savedCharacter)

                // Check for Piercing Shot picto and add free-aim damage modifier
                checkAndApplyPiercingShotModifier(savedCharacter)

                // Check for Sniper picto and add first-shot damage modifier
                checkAndApplySniperModifier(savedCharacter)

                // Check for Versatile picto and add base-attack damage modifier
                checkAndApplyVersatileModifier(savedCharacter)

                // Check for Breaking Shots picto and add conditional free-aim damage modifier
                checkAndApplyBreakingShotsModifier(savedCharacter)

                // Check for Augmented Attack picto and add base-attack damage modifier
                checkAndApplyAugmentedAttackModifier(savedCharacter)

                // Check for Augmented First Strike picto and add first-hit damage modifier
                checkAndApplyAugmentedFirstStrikeModifier(savedCharacter)

                // Check for Powered Attack picto and add MP-conditional damage modifier
                checkAndApplyPoweredAttackModifier(savedCharacter)

                request.initiative?.let { initiativeRequest ->
                        when {
                                !isBattleStarted -> {
                                        val initiative =
                                                BattleInitiative(
                                                        battleId = battleId,
                                                        battleCharacterId = savedCharacter.id!!,
                                                        initiativeValue =
                                                                initiativeRequest.initiativeValue,
                                                        hability = initiativeRequest.hability,
                                                        playFirst = initiativeRequest.playFirst
                                                )

                                        initiativeRepository.save(initiative)
                                }
                                isBattleStarted &&
                                        request.characterType.equals("npc", ignoreCase = true) -> {
                                        val lastTurn =
                                                battleTurnRepository
                                                        .findTopByBattleIdOrderByPlayOrderDesc(
                                                                battleId
                                                        )
                                        val nextOrder = (lastTurn?.playOrder ?: 0) + 1
                                        val turn =
                                                BattleTurn(
                                                        battleId = battleId,
                                                        battleCharacterId = savedCharacter.id!!,
                                                        playOrder = nextOrder
                                                )
                                        battleTurnRepository.save(turn)
                                }
                                else -> {}
                        }
                }

                val eventJson =
                        objectMapper.writeValueAsString(
                                mapOf(
                                        "battleCharacterId" to savedCharacter.id,
                                        "characterName" to savedCharacter.characterName,
                                        "characterType" to savedCharacter.characterType,
                                        "externalId" to savedCharacter.externalId,
                                        "isEnemy" to savedCharacter.isEnemy,
                                        "canRollInitiative" to savedCharacter.canRollInitiative
                                )
                        )

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "ADD_CHARACTER",
                                eventJson = eventJson
                        )
                )

                return savedCharacter.id!!
        }

        @Transactional
        fun removeCharacter(id: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val character = opt.get()

                val battleId =
                        character.battleId ?: error("BattleCharacter $id não possui battleId")

                battleTurnRepository.deleteByBattleCharacterId(id)

                repository.deleteById(id)

                battleTurnService.recalculatePlayOrder(battleId)

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "REMOVE_CHARACTER",
                                eventJson = null
                        )
                )
        }

        fun listCharacters(battleId: Int): List<BattleCharacter> {
                return repository.findByBattleId(battleId)
        }

        @Transactional
        fun updateCharacterHp(id: Int, newHp: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                val finalHp = newHp.coerceAtLeast(0)

                entity.healthPoints = finalHp

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "HP_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun updateCharacterMaxHp(id: Int, newMaxHp: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                val finalMaxHp = newMaxHp.coerceAtLeast(1)

                entity.maxHealthPoints = finalMaxHp

                // If current HP exceeds new max HP, reduce it
                if (entity.healthPoints > finalMaxHp) {
                        entity.healthPoints = finalMaxHp
                }

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "MAX_HP_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun updateCharacterMp(id: Int, newMp: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                val finalMp = newMp.coerceAtLeast(0)

                entity.magicPoints = finalMp

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "MP_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun updateCharacterStance(id: Int, newStance: String?) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                entity.stance = newStance

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "STANCE_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun updateCharacterStains(id: Int, stainSlot1: String?, stainSlot2: String?, stainSlot3: String?, stainSlot4: String?) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                entity.stainSlot1 = stainSlot1
                entity.stainSlot2 = stainSlot2
                entity.stainSlot3 = stainSlot3
                entity.stainSlot4 = stainSlot4

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "STAINS_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun updateCharacterRank(id: Int, perfectionRank: String?, rankProgress: Int?) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                entity.perfectionRank = perfectionRank
                entity.rankProgress = rankProgress

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "RANK_CHANGED", eventJson = null)
                )
        }

        @Transactional
        fun rankUpCharacter(id: Int): Boolean {
                val opt = repository.findById(id)
                if (opt.isEmpty) return false

                val entity = opt.get()
                val currentRank = entity.perfectionRank ?: "D"
                val currentProgress = entity.rankProgress ?: 0

                // Get next rank
                val nextRank = when (currentRank) {
                        "D" -> "C"
                        "C" -> "B"
                        "B" -> "A"
                        "A" -> "S"
                        "S" -> return false  // Already max rank
                        else -> return false
                }

                // Rank up: keep current progress (don't reset)
                entity.perfectionRank = nextRank
                entity.rankProgress = currentProgress

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "RANK_CHANGED", eventJson = null)
                )

                return true
        }

        @Transactional
        fun rankDownCharacter(id: Int): Boolean {
                val opt = repository.findById(id)
                if (opt.isEmpty) return false

                val entity = opt.get()
                val currentRank = entity.perfectionRank ?: "D"
                val currentProgress = entity.rankProgress ?: 0

                // If already at D rank, reset progress to 0
                if (currentRank == "D") {
                        entity.rankProgress = 0
                        repository.save(entity)

                        val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")
                        battleLogRepository.save(
                                BattleLog(battleId = battleId, eventType = "RANK_CHANGED", eventJson = null)
                        )

                        return true
                }

                // Get previous rank
                val previousRank = when (currentRank) {
                        "S" -> "A"
                        "A" -> "B"
                        "B" -> "C"
                        "C" -> "D"
                        "D" -> return false  // Already min rank
                        else -> return false
                }

                // Rank down: keep current progress (don't reset)
                entity.perfectionRank = previousRank
                entity.rankProgress = currentProgress

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "RANK_CHANGED", eventJson = null)
                )

                return true
        }

        @Transactional
        fun updateCharacterAP(id: Int, amount: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val entity = opt.get()

                // AP system uses Magic Points
                val currentMP = entity.magicPoints ?: 0
                val maxMP = entity.maxMagicPoints ?: 0

                // Calculate new MP value
                val newMP = if (maxMP > 0) {
                        (currentMP + amount).coerceIn(0, maxMP)
                } else {
                        (currentMP + amount).coerceAtLeast(0)
                }

                entity.magicPoints = newMP

                repository.save(entity)

                val battleId = entity.battleId ?: error("BattleCharacter $id não possui battleId")

                battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "AP_CHANGED", eventJson = null)
                )
        }

        fun getCharacterAP(id: Int): Map<String, Int?> {
                val opt = repository.findById(id)
                if (opt.isEmpty) {
                        throw IllegalArgumentException("BattleCharacter $id not found")
                }

                val entity = opt.get()

                return mapOf(
                        "actionPoints" to entity.magicPoints,
                        "maxActionPoints" to entity.maxMagicPoints
                )
        }

        /**
         * Checks if character has Solo Fighter picto and adds the damage modifier.
         * Solo Fighter: "Deal 50% more damage if fighting alone."
         * Adds a 1.5x multiplier with "solo" condition.
         */
        private fun checkAndApplySoloFighterModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Solo Fighter picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasSoloFighter = pictos.any {
                        it.pictoId.lowercase() == "solo-fighter" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasSoloFighter) {
                        // Add damage modifier: 1.5x (50% more) when fighting alone
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "all",  // Applies to all attack types
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = "solo"  // Only when fighting alone
                        )
                }
        }

        /**
         * Checks if character has Last Stand Critical picto and adds the critical modifier.
         * Last Stand Critical: "100% Critical Chance while fighting alone."
         * Adds a 2.0x multiplier with "solo" condition (represents guaranteed crit).
         */
        private fun checkAndApplyLastStandCriticalModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Last Stand Critical picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasLastStandCritical = pictos.any {
                        it.pictoId.lowercase() == "last-stand-critical" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasLastStandCritical) {
                        // Add damage modifier: 2.0x (100% more damage, equivalent to guaranteed crit) when fighting alone
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "all",  // Applies to all attack types
                                multiplier = 2.0,  // 100% more damage (2x, representing guaranteed critical)
                                flatBonus = 0,
                                condition = "solo"  // Only when fighting alone
                        )
                }
        }

        /**
         * Checks if character has Augmented Aim picto and adds the free-aim damage modifier.
         * Augmented Aim: "Deal 50% more damage on Free Aim shots."
         * Adds a 1.5x multiplier for free-aim attacks only.
         */
        private fun checkAndApplyAugmentedAimModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Augmented Aim picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasAugmentedAim = pictos.any {
                        it.pictoId.lowercase() == "augmented-aim" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasAugmentedAim) {
                        // Add damage modifier: 1.5x (50% more damage) for free-aim attacks
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "free-shot",  // Only applies to free-aim attacks
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = null  // Always active for free-aim attacks
                        )
                }
        }

        /**
         * Checks if character has Piercing Shot picto and adds the free-aim damage modifier.
         * Piercing Shot: "25% increased Free Aim damage. Free Aim shots ignore Shields."
         * Adds a 1.25x multiplier for free-aim attacks and marks that shields should be ignored.
         */
        private fun checkAndApplyPiercingShotModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Piercing Shot picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasPiercingShot = pictos.any {
                        it.pictoId.lowercase() == "piercing-shot" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasPiercingShot) {
                        // Add damage modifier: 1.25x (25% more damage) for free-aim attacks
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "free-shot",  // Only applies to free-aim attacks
                                multiplier = 1.25,  // 25% more damage (1 + 0.25)
                                flatBonus = 0,
                                condition = null  // Always active for free-aim attacks
                        )
                }
        }

        /**
         * Checks if character has Sniper picto and adds the first-shot damage modifier.
         * Sniper: "First Free Aim shot each turn deals 200% increased damage and can Break."
         * Adds a 3.0x multiplier (200% more = 3x total) for first free-aim attack each turn.
         */
        private fun checkAndApplySniperModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Sniper picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasSniper = pictos.any {
                        it.pictoId.lowercase() == "sniper" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasSniper) {
                        // Add damage modifier: 3.0x (200% more damage = 3x total) for first free-aim each turn
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "free-shot",  // Only applies to free-aim attacks
                                multiplier = 3.0,  // 200% more damage (1 + 2.0 = 3x)
                                flatBonus = 0,
                                condition = "sniper-first-shot"  // Only first free-aim per turn
                        )
                }
        }

        /**
         * Checks if character has Versatile picto and adds the base-attack damage modifier.
         * Versatile: "After a Free Aim hit, Base Attack damage is increased by 50% for 1 turn."
         * Adds a 1.5x multiplier for base attacks when VersatileBuff status is active.
         */
        private fun checkAndApplyVersatileModifier(battleCharacter: BattleCharacter) {
                // Only works for player characters
                if (battleCharacter.characterType != "player") {
                        return
                }

                // Check if player has Versatile picto equipped (slots 0-2)
                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasVersatile = pictos.any {
                        it.pictoId.lowercase() == "versatile" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasVersatile) {
                        // Add damage modifier: 1.5x (50% more damage) for base attacks when buff is active
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "base-attack",  // Only applies to base attacks
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = "versatile-buff"  // Only when VersatileBuff status is active
                        )
                }
        }

        /**
         * Breaking Shots: Deals 50% more damage with Free Aim shots if target has Fragile or Broken
         */
        private fun checkAndApplyBreakingShotsModifier(battleCharacter: BattleCharacter) {
                if (battleCharacter.characterType != "player") {
                        return
                }

                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasBreakingShots = pictos.any {
                        it.pictoId.lowercase() == "breaking-shots" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasBreakingShots) {
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "free-shot",  // Only applies to free-aim shots
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = "enemy-fragile-or-broken"  // Only when target has Fragile or Broken
                        )
                }
        }

        /**
         * Augmented Attack: Deals 50% more damage with Base Attacks
         */
        private fun checkAndApplyAugmentedAttackModifier(battleCharacter: BattleCharacter) {
                if (battleCharacter.characterType != "player") {
                        return
                }

                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasAugmentedAttack = pictos.any {
                        it.pictoId.lowercase() == "augmented-attack" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasAugmentedAttack) {
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "base-attack",  // Only applies to base attacks
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = null  // Always active for base attacks
                        )
                }
        }

        /**
         * Augmented First Strike: Deals 50% more damage on first hit in battle (once per battle)
         */
        private fun checkAndApplyAugmentedFirstStrikeModifier(battleCharacter: BattleCharacter) {
                if (battleCharacter.characterType != "player") {
                        return
                }

                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasAugmentedFirstStrike = pictos.any {
                        it.pictoId.lowercase() == "augmented-first-strike" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasAugmentedFirstStrike) {
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "all",  // Applies to all attack types
                                multiplier = 1.5,  // 50% more damage (1 + 0.5)
                                flatBonus = 0,
                                condition = "first-hit-in-battle"  // Only on first attack in battle
                        )
                }
        }

        /**
         * Calculates the total extra hits for base attacks from Combo Attack pictos
         * Combo Attack I = +1 hit, II = +2 hits, III = +3 hits (stackable)
         */
        fun calculateExtraBaseAttackHits(battleCharacterId: Int): Int {
                val character = repository.findById(battleCharacterId).orElse(null) ?: return 0

                if (character.characterType != "player") {
                        return 0
                }

                val playerId = character.externalId.toIntOrNull() ?: return 0
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                var extraHits = 0

                // Check for Combo Attack I (+1 hit)
                if (pictos.any { it.pictoId.lowercase() == "combo-attack-i" && it.slot != null && it.slot in 0..2 }) {
                        extraHits += 1
                }

                // Check for Combo Attack II (+2 hits)
                if (pictos.any { it.pictoId.lowercase() == "combo-attack-ii" && it.slot != null && it.slot in 0..2 }) {
                        extraHits += 2
                }

                // Check for Combo Attack III (+3 hits)
                if (pictos.any { it.pictoId.lowercase() == "combo-attack-iii" && it.slot != null && it.slot in 0..2 }) {
                        extraHits += 3
                }

                return extraHits
        }

        /**
         * Powered Attack: Deals 20% more damage if character has MP available (consumes 1 MP per hit)
         */
        private fun checkAndApplyPoweredAttackModifier(battleCharacter: BattleCharacter) {
                if (battleCharacter.characterType != "player") {
                        return
                }

                val playerId = battleCharacter.externalId.toIntOrNull() ?: return
                val pictos = playerPictoRepository.findByPlayerId(playerId)

                val hasPoweredAttack = pictos.any {
                        it.pictoId.lowercase() == "powered-attack" &&
                        it.slot != null &&
                        it.slot in 0..2
                }

                if (hasPoweredAttack) {
                        damageModifierService.addModifier(
                                battleCharacterId = battleCharacter.id!!,
                                type = "all",  // Applies to all attack types
                                multiplier = 1.2,  // 20% more damage (1 + 0.2)
                                flatBonus = 0,
                                condition = "has-mp"  // Only when character has MP available
                        )
                }
        }
}
