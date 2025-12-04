package com.example.demo.controller

import com.example.demo.dto.CreatePlayerLuminaRequest
import com.example.demo.dto.UpdatePlayerLuminaRequest
import com.example.demo.model.PlayerLumina
import com.example.demo.repository.PlayerLuminaRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/player-luminas")
class PlayerLuminaController(private val repository: PlayerLuminaRepository) {

    @PostMapping
    fun create(@RequestBody input: CreatePlayerLuminaRequest): Int {
        val saved =
                repository.save(
                        PlayerLumina(
                                playerId = input.playerId,
                                pictoId = input.pictoId,
                                isEquiped = false
                        )
                )
        return saved.id
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody input: UpdatePlayerLuminaRequest): PlayerLumina {
        val current = repository.findById(id).orElseThrow()
        val updated = current.copy(isEquiped = input.isEquiped)
        return repository.save(updated)
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int) {
        repository.deleteById(id)
    }
}
