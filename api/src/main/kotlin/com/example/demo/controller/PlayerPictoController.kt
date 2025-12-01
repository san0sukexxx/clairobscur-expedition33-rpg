package com.example.demo.controller

import com.example.demo.dto.CreatePlayerPictoRequest
import com.example.demo.dto.UpdatePlayerPictoRequest
import com.example.demo.dto.UpdatePlayerPictoSlotRequest
import com.example.demo.model.PlayerPicto
import com.example.demo.repository.PlayerPictoRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-pictos")
class PlayerPictoController(private val repository: PlayerPictoRepository) {

    @PostMapping
    fun create(@RequestBody body: CreatePlayerPictoRequest): Int {
        val existing = repository.findByPlayerIdAndPictoId(body.playerId, body.pictoId)
        if (existing != null) return existing.id

        val entity =
                PlayerPicto(
                        playerId = body.playerId,
                        pictoId = body.pictoId,
                        level = body.level,
                        battleCount = 0
                )

        return repository.save(entity).id
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerPictoRequest
    ): ResponseEntity<Void> {
        val opt = repository.findById(id)
        if (opt.isEmpty) {
            return ResponseEntity.notFound().build()
        }

        val updated = opt.get().copy(level = body.level)
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

    @PutMapping("/{id}/slot")
    fun updateSlot(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerPictoSlotRequest
    ): ResponseEntity<Void> {

        val opt = repository.findById(id)
        if (opt.isEmpty) return ResponseEntity.notFound().build()

        val picto = opt.get()

        if (body.slot != null) {
            val othersSameSlot =
                    repository.findByPlayerId(picto.playerId).filter {
                        it.id != picto.id && it.slot == body.slot
                    }

            othersSameSlot.forEach { other -> repository.save(other.copy(slot = null)) }
        }

        val updated = picto.copy(slot = body.slot)
        repository.save(updated)

        return ResponseEntity.noContent().build()
    }
}
