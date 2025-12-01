package com.example.demo.controller

import com.example.demo.dto.CreatePlayerPictoRequest
import com.example.demo.dto.UpdatePlayerPictoRequest
import com.example.demo.model.PlayerPicto
import com.example.demo.repository.PlayerPictoRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/player-pictos")
class PlayerPictoController(private val repository: PlayerPictoRepository) {

    @GetMapping("/player/{playerId}")
    fun getByPlayer(@PathVariable playerId: Int): List<PlayerPicto> =
            repository.findByPlayerId(playerId)

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Int): ResponseEntity<PlayerPicto> =
            repository
                    .findById(id)
                    .map { ResponseEntity.ok(it) }
                    .orElse(ResponseEntity.notFound().build())

    @PostMapping
    fun create(@RequestBody body: CreatePlayerPictoRequest): PlayerPicto {
        val existing = repository.findByPlayerIdAndPictoId(body.playerId, body.pictoId)
        if (existing != null) return existing

        val entity =
                PlayerPicto(playerId = body.playerId, pictoId = body.pictoId, level = body.level)

        return repository.save(entity)
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerPictoRequest
    ): ResponseEntity<PlayerPicto> {
        val opt = repository.findById(id)
        if (opt.isEmpty) return ResponseEntity.notFound().build()

        val updated = opt.get().copy(level = body.level)
        return ResponseEntity.ok(repository.save(updated))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build()
        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
