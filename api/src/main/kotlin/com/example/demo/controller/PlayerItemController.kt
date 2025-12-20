package com.example.demo.controller

import com.example.demo.dto.CreatePlayerItemRequest
import com.example.demo.dto.UpdatePlayerItemRequest
import com.example.demo.dto.UseItemRequest
import com.example.demo.model.PlayerItem
import com.example.demo.repository.PlayerItemRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.model.BattleLog
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional

@RestController
@RequestMapping("/api/player-items")
class PlayerItemController(
    private val repository: PlayerItemRepository,
    private val playerRepository: PlayerRepository,
    private val battleCharacterRepository: BattleCharacterRepository,
    private val battleLogRepository: BattleLogRepository
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
                } else {
                    playerEntity.hpCurrent = body.maxHp
                    playerRepository.save(playerEntity)
                }
            }
            "healing-elixir" -> {
                val percent = body.recoveryPercent ?: 30
                val recoveryAmount = (body.maxHp * percent) / 100
                val newHp = minOf(playerEntity.hpCurrent + recoveryAmount, body.maxHp)

                val battleCharacter = battleCharacterRepository.findAll()
                    .firstOrNull { it.externalId == body.playerId.toString() && it.characterType.equals("player", ignoreCase = true) }

                battleCharacter?.let {
                    it.healthPoints = newHp
                    battleCharacterRepository.save(it)
                    playerEntity.hpCurrent = newHp
                    playerRepository.save(playerEntity)

                    val battleId = it.battleId
                    battleLogRepository.save(
                        BattleLog(battleId = battleId, eventType = "HP_CHANGED", eventJson = null)
                    )
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
                val recoveryAmount = (target.maxHealthPoints * percent) / 100
                val newHp = minOf(recoveryAmount, target.maxHealthPoints)

                target.healthPoints = newHp
                battleCharacterRepository.save(target)

                val battleId = target.battleId
                battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "HP_CHANGED", eventJson = null)
                )
            }
            else -> {
                return ResponseEntity.badRequest().build()
            }
        }

        val updatedItem = item.copy(quantity = item.quantity - 1)
        repository.save(updatedItem)

        return ResponseEntity.ok().build()
    }
}
