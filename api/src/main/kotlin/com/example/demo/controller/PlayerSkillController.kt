package com.example.demo.controller

import com.example.demo.dto.CreatePlayerSkillRequest
import com.example.demo.dto.UpdatePlayerSkillRequest
import com.example.demo.model.PlayerSkill
import com.example.demo.repository.PlayerSkillRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-Skills")
class PlayerSkillController(private val repository: PlayerSkillRepository) {

    @PostMapping
    fun create(@RequestBody body: CreatePlayerSkillRequest): Int {
        val existing = repository.findByPlayerIdAndSkillId(body.playerId, body.skillId)

        if (existing != null) {
            return existing.id ?: 0
        }

        val entity =
                PlayerSkill(
                        playerId = body.playerId,
                        skillId = body.skillId,
                        slot = body.slot
                )

        return repository.save(entity).id ?: 0
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerSkillRequest
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
        val skills = repository.findByPlayerId(playerId)
        repository.deleteAll(skills)
        return ResponseEntity.noContent().build()
    }
}
