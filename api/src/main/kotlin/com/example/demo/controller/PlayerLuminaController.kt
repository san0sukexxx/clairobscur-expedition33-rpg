package com.example.demo.controller

import com.example.demo.dto.CreatePlayerLuminaRequest
import com.example.demo.dto.UpdatePlayerLuminaRequest
import com.example.demo.model.PlayerLumina
import com.example.demo.repository.PlayerLuminaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-luminas")
class PlayerLuminaController(private val repository: PlayerLuminaRepository) {

    @GetMapping("/player/{playerId}")
    fun getByPlayer(@PathVariable playerId: Int): List<PlayerLumina> =
            repository.findByPlayerId(playerId)

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Int): ResponseEntity<PlayerLumina> =
            repository
                    .findById(id)
                    .map { ResponseEntity.ok(it) }
                    .orElse(ResponseEntity.notFound().build())

    @PostMapping
    fun create(@RequestBody body: CreatePlayerLuminaRequest): PlayerLumina {
        val existing = repository.findByPlayerIdAndPictoId(body.playerId, body.pictoId)
        if (existing != null) return existing

        val entity = PlayerLumina(playerId = body.playerId, pictoId = body.pictoId)

        return repository.save(entity)
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerLuminaRequest
    ): ResponseEntity<PlayerLumina> {
        val opt = repository.findById(id)
        if (opt.isEmpty) return ResponseEntity.notFound().build()

        val updated = opt.get().copy(pictoId = body.pictoId)
        return ResponseEntity.ok(repository.save(updated))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build()
        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
