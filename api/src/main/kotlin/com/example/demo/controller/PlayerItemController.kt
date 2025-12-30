package com.example.demo.controller

import com.example.demo.dto.CreatePlayerItemRequest
import com.example.demo.dto.UpdatePlayerItemRequest
import com.example.demo.dto.UseItemRequest
import com.example.demo.model.PlayerItem
import com.example.demo.repository.PlayerItemRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerPictoRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.model.BattleStatusEffect
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional

@RestController
@RequestMapping("/api/player-items")
class PlayerItemController(
    private val repository: PlayerItemRepository,
    private val playerRepository: PlayerRepository,
    private val battleCharacterRepository: BattleCharacterRepository,
    private val battleLogRepository: BattleLogRepository,
    private val battleTurnRepository: BattleTurnRepository,
    private val playerPictoRepository: PlayerPictoRepository,
    private val battleStatusEffectRepository: BattleStatusEffectRepository,
    private val battleRepository: BattleRepository,
    private val objectMapper: ObjectMapper,
    private val damageService: com.example.demo.service.DamageService
) {

    @PostMapping
    fun create(@RequestBody body: CreatePlayerItemRequest): Int {
        val existing = repository.findByPlayerIdAndItemId(body.playerId, body.itemId)

        if (existing != null) {
            val newQuantity = minOf(existing.quantity + body.quantity, existing.maxQuantity)
            val updated = existing.copy(quantity = newQuantity)
            repository.save(updated)
            return existing.id
        }

        val entity =
                PlayerItem(
                        playerId = body.playerId,
                        itemId = body.itemId,
                        quantity = body.quantity,
                        maxQuantity = body.maxQuantity
                )

        return repository.save(entity).id
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerItemRequest
    ): ResponseEntity<Void> {
        val opt = repository.findById(id)
        if (opt.isEmpty) {
            return ResponseEntity.notFound().build()
        }

        val item = opt.get()

        val newMaxQuantity = body.maxQuantity ?: item.maxQuantity
        val rawQuantity = body.quantity?.let { minOf(it, newMaxQuantity) } ?: item.quantity
        val newQuantity = maxOf(0, rawQuantity)

        val updated = item.copy(quantity = newQuantity, maxQuantity = newMaxQuantity)
        repository.save(updated)

        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }

        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/use")
    @Transactional
    fun useItem(@RequestBody body: UseItemRequest): ResponseEntity<Void> {
        val player = playerRepository.findById(body.playerId)
        if (player.isEmpty) {
            return ResponseEntity.badRequest().build()
        }

        val playerEntity = player.get()

        val item = repository.findByPlayerIdAndItemId(body.playerId, body.itemId)
        if (item == null) {
            return ResponseEntity.badRequest().build()
        }

        if (item.quantity <= 0) {
            return ResponseEntity.badRequest().build()
        }

        when (body.itemId) {
            "chroma-elixir" -> {
                val battleCharacter = battleCharacterRepository.findAll()
                    .firstOrNull { it.externalId == body.playerId.toString() && it.characterType.equals("player", ignoreCase = true) }

                if (battleCharacter != null) {
                    battleCharacter.healthPoints = body.maxHp
                    battleCharacterRepository.save(battleCharacter)
                    playerEntity.hpCurrent = body.maxHp
                    playerRepository.save(playerEntity)

                    // Charging Tint: Increase gradient by 5%
                    val battleId = battleCharacter.battleId
                    applyChargingTint(battleCharacter, battleId)
                } else {
                    playerEntity.hpCurrent = body.maxHp
                    playerRepository.save(playerEntity)
                }
            }
            "healing-elixir" -> {
                val percent = body.recoveryPercent ?: 30
                val baseRecoveryAmount = (body.maxHp * percent) / 100

                val battleCharacter = battleCharacterRepository.findAll()
                    .firstOrNull { it.externalId == body.playerId.toString() && it.characterType.equals("player", ignoreCase = true) }

                battleCharacter?.let {
                    // Apply Effective Heal modifier (doubles healing if equipped)
                    val recoveryAmount = damageService.applyEffectiveHeal(it, baseRecoveryAmount)
                    val newHp = minOf(playerEntity.hpCurrent + recoveryAmount, body.maxHp)

                    it.healthPoints = newHp
                    battleCharacterRepository.save(it)
                    playerEntity.hpCurrent = newHp
                    playerRepository.save(playerEntity)

                    val battleId = it.battleId
                    battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "HP_CHANGED", eventJson = null)
                    )

                    // Apply Healing Share: distribute 15% of heal to characters with healing-share picto
                    damageService.applyHealingShare(battleId, it, recoveryAmount)

                    // Cleansing Tint: Remove all negative status effects
                    applyCleansingTint(it)

                    // Great Healing Tint: Apply healing to all allies
                    applyGreatHealingTint(it, recoveryAmount, body.maxHp)

                    // Charging Tint: Increase gradient by 5%
                    applyChargingTint(it, battleId)
                }
            }
            "energy-elixir" -> {
                val percent = body.recoveryPercent ?: 30

                val battleCharacter = battleCharacterRepository.findAll()
                    .firstOrNull { it.externalId == body.playerId.toString() && it.characterType.equals("player", ignoreCase = true) }

                battleCharacter?.let {
                    val currentMp = it.magicPoints ?: 0
                    val recoveryAmount = (body.maxMp * percent) / 100
                    val newMp = minOf(currentMp + recoveryAmount, body.maxMp)

                    it.magicPoints = newMp
                    battleCharacterRepository.save(it)
                    playerEntity.mpCurrent = newMp
                    playerRepository.save(playerEntity)

                    val battleId = it.battleId
                    battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "MP_CHANGED", eventJson = null)
                    )

                    // Time Tint: Apply Hastened status
                    applyTimeTint(it)

                    // Charging Tint: Increase gradient by 5%
                    applyChargingTint(it, battleId)
                }
            }
            "revive-elixir" -> {
                val percent = body.recoveryPercent ?: 30
                val targetBattleCharacterId = body.targetBattleCharacterId ?: return ResponseEntity.badRequest().build()

                val targetCharacter = battleCharacterRepository.findById(targetBattleCharacterId)
                if (targetCharacter.isEmpty) {
                    return ResponseEntity.badRequest().build()
                }

                val target = targetCharacter.get()
                val wasDeadBefore = target.healthPoints <= 0

                val baseRecoveryAmount = (target.maxHealthPoints * percent) / 100
                // Apply Effective Heal modifier (doubles healing if equipped)
                val recoveryAmount = damageService.applyEffectiveHeal(target, baseRecoveryAmount)
                val newHp = minOf(recoveryAmount, target.maxHealthPoints)

                target.healthPoints = newHp
                battleCharacterRepository.save(target)

                val battleId = target.battleId
                battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "HP_CHANGED", eventJson = null)
                )

                // Apply Healing Share: distribute 15% of heal to characters with healing-share picto
                damageService.applyHealingShare(battleId, target, recoveryAmount)

                // Check for Revive Paradox picto - make character play immediately after revive
                if (wasDeadBefore && newHp > 0) {
                    handleReviveParadox(battleId, target)

                    // Revive Tint Energy: Grant 3 MP on revive
                    applyReviveTintEnergy(target)
                }

                // Charging Tint: Increase gradient by 5% (check the USER, not the target)
                val userBattleCharacter = battleCharacterRepository.findAll()
                    .firstOrNull { it.externalId == body.playerId.toString() && it.characterType.equals("player", ignoreCase = true) }
                userBattleCharacter?.let { user ->
                    applyChargingTint(user, battleId)
                }
            }
            else -> {
                return ResponseEntity.badRequest().build()
            }
        }

        val updatedItem = item.copy(quantity = item.quantity - 1)
        repository.save(updatedItem)

        return ResponseEntity.ok().build()
    }

    /**
     * Checks if character has "Revive Paradox" picto equipped and inserts them as first in turn order.
     * Revive Paradox: "Play immediately when revived."
     */
    @Transactional
    fun handleReviveParadox(battleId: Int, battleCharacter: com.example.demo.model.BattleCharacter) {
        // Only works for player characters
        if (battleCharacter.characterType != "player") {
            return
        }

        // Check if player has Revive Paradox picto equipped (slots 0-2)
        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasReviveParadox = pictos.any {
            it.pictoId.lowercase() == "revive-paradox" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasReviveParadox) {
            return
        }

        // Get all current turns for this battle, sorted by playOrder (ascending = lower goes first)
        val allTurns = battleTurnRepository.findByBattleId(battleId).sortedBy { it.playOrder }

        if (allTurns.isEmpty()) {
            return
        }

        // Find the lowest playOrder value (first to play)
        val lowestPlayOrder = allTurns.first().playOrder

        // Insert this character with playOrder = lowestPlayOrder - 1 (to be first)
        val newTurn = BattleTurn(
                battleId = battleId,
                battleCharacterId = battleCharacter.id!!,
                playOrder = lowestPlayOrder - 1
        )

        battleTurnRepository.save(newTurn)

        // Log the event
        val eventJson = objectMapper.writeValueAsString(
                mapOf(
                        "battleCharacterId" to battleCharacter.id!!,
                        "characterName" to battleCharacter.characterName,
                        "newPlayOrder" to (lowestPlayOrder - 1),
                        "result" to "activated"
                )
        )

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "REVIVE_PARADOX",
                        eventJson = eventJson
                )
        )
    }

    /**
     * Checks if character has "Charging Tint" picto and increases team gradient by 5.
     * Charging Tint: "Any potion used increases gradient by 5%."
     */
    @Transactional
    fun applyChargingTint(
        battleCharacter: com.example.demo.model.BattleCharacter,
        battleId: Int
    ) {
        if (battleCharacter.characterType != "player") {
            return
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasChargingTint = pictos.any {
            it.pictoId.lowercase() == "charging-tint" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasChargingTint) {
            return
        }

        // Get battle and increase gradient by 5 for the character's team
        val battle = battleRepository.findById(battleId).orElse(null) ?: return

        if (battleCharacter.isEnemy) {
            // Team B (enemies)
            battle.teamBGradientPoints = minOf(battle.teamBGradientPoints + 5, 100)
        } else {
            // Team A (players)
            battle.teamAGradientPoints = minOf(battle.teamAGradientPoints + 5, 100)
        }

        battleRepository.save(battle)

        battleLogRepository.save(
            BattleLog(battleId = battleId, eventType = "CHARGING_TINT", eventJson = null)
        )
    }

    /**
     * Checks if character has "Great Healing Tint" picto and applies healing to all allies.
     * Great Healing Tint: "Healing potion effects affect all team members."
     */
    @Transactional
    fun applyGreatHealingTint(
        battleCharacter: com.example.demo.model.BattleCharacter,
        recoveryAmount: Int,
        maxHp: Int
    ) {
        if (battleCharacter.characterType != "player") {
            return
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasGreatHealingTint = pictos.any {
            it.pictoId.lowercase() == "great-healing-tint" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasGreatHealingTint) {
            return
        }

        val battleId = battleCharacter.battleId ?: return

        // Get all allies (same team, excluding self)
        val allies = battleCharacterRepository
            .findByBattleIdAndIsEnemy(battleId, battleCharacter.isEnemy)
            .filter { it.id != battleCharacter.id && it.healthPoints > 0 }

        // Apply healing to all allies
        allies.forEach { ally ->
            val currentHp = ally.healthPoints
            val newHp = minOf(currentHp + recoveryAmount, ally.maxHealthPoints)

            ally.healthPoints = newHp
            battleCharacterRepository.save(ally)

            // Apply Cleansing Tint to allies as well
            applyCleansingTint(ally)
        }

        if (allies.isNotEmpty()) {
            battleLogRepository.save(
                BattleLog(battleId = battleId, eventType = "GREAT_HEALING_TINT", eventJson = null)
            )
        }
    }

    /**
     * Checks if character has "Time Tint" picto and applies Hastened status.
     * Time Tint: "Mana potions also apply Hastened status."
     */
    @Transactional
    fun applyTimeTint(battleCharacter: com.example.demo.model.BattleCharacter) {
        if (battleCharacter.characterType != "player") {
            return
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasTimeTint = pictos.any {
            it.pictoId.lowercase() == "time-tint" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (hasTimeTint) {
            // Apply Hastened status for 2 turns
            val hastenedEffect = BattleStatusEffect(
                battleCharacterId = battleCharacter.id!!,
                effectType = "Hastened",
                ammount = 0,
                remainingTurns = 2
            )
            battleStatusEffectRepository.save(hastenedEffect)
        }
    }

    /**
     * Checks if reviver has "Revive Tint Energy" picto and grants 3 MP to revived character.
     * Revive Tint Energy: "Revived allies get 3 MP instead of 0."
     */
    @Transactional
    fun applyReviveTintEnergy(targetCharacter: com.example.demo.model.BattleCharacter) {
        if (targetCharacter.characterType != "player") {
            return
        }

        val playerId = targetCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasReviveTintEnergy = pictos.any {
            it.pictoId.lowercase() == "revive-tint-energy" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (hasReviveTintEnergy) {
            targetCharacter.magicPoints = 3
            battleCharacterRepository.save(targetCharacter)
        }
    }

    /**
     * Checks if character has "Cleansing Tint" picto and removes all negative status effects.
     * Cleansing Tint: "Healing potions also remove all negative status effects."
     */
    @Transactional
    fun applyCleansingTint(battleCharacter: com.example.demo.model.BattleCharacter) {
        if (battleCharacter.characterType != "player") {
            return
        }

        val playerId = battleCharacter.externalId.toIntOrNull() ?: return
        val pictos = playerPictoRepository.findByPlayerId(playerId)

        val hasCleansingTint = pictos.any {
            it.pictoId.lowercase() == "cleansing-tint" &&
            it.slot != null &&
            it.slot in 0..2
        }

        if (!hasCleansingTint) {
            return
        }

        // Remove all negative status effects
        val negativeStatusTypes = listOf(
            "Burning", "Frozen", "Stunned", "Cursed", "Dizzy",
            "Exhaust", "Bound", "Inverted", "Blight", "Charm"
        )

        val negativeEffects = battleStatusEffectRepository
            .findByBattleCharacterId(battleCharacter.id!!)
            .filter { it.effectType in negativeStatusTypes }

        negativeEffects.forEach { effect ->
            battleStatusEffectRepository.deleteById(effect.id!!)
        }
    }
}
