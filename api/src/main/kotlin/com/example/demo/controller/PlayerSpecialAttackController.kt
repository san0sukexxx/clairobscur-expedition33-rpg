package com.example.demo.controller

import com.example.demo.dto.CreatePlayerSpecialAttackRequest
import com.example.demo.dto.UpdatePlayerSpecialAttackRequest
import com.example.demo.model.PlayerSpecialAttack
import com.example.demo.repository.PlayerSpecialAttackRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-special-attacks")
class PlayerSpecialAttackController(private val repository: PlayerSpecialAttackRepository) {

    @PostMapping
    fun create(@RequestBody body: CreatePlayerSpecialAttackRequest): Int {
        val existing = repository.findByPlayerIdAndSpecialAttackId(body.playerId, body.specialAttackId)

        if (existing != null) {
            return existing.id ?: 0
        }

        val entity =
                PlayerSpecialAttack(
                        playerId = body.playerId,
                        specialAttackId = body.specialAttackId,
                        slot = body.slot
                )

        return repository.save(entity).id ?: 0
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerSpecialAttackRequest
    ): ResponseEntity<Void> {
        val existing = repository.findById(id).orElse(null)
                ?: return ResponseEntity.notFound().build()

        val updated =
                existing.copy(
                        slot = body.slot
                )

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

    @DeleteMapping("/player/{playerId}")
    fun deleteAllByPlayerId(@PathVariable playerId: Int): ResponseEntity<Void> {
        val specialAttacks = repository.findByPlayerId(playerId)
        repository.deleteAll(specialAttacks)
        return ResponseEntity.noContent().build()
    }
}
