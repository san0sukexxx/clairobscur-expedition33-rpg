package com.example.demo.controller

import com.example.demo.dto.CreatePlayerSkillRequest
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
                        skillId = body.skillId
                )

        return repository.save(entity).id ?: 0
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }

        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
