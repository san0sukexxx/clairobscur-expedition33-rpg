package com.example.demo.controller

import com.example.demo.dto.CreatePlayerWeaponRequest
import com.example.demo.dto.PlayerWeaponResponse
import com.example.demo.dto.UpdatePlayerWeaponRequest
import com.example.demo.model.PlayerWeapon
import com.example.demo.repository.PlayerWeaponRepository
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-weapons")
class PlayerWeaponController(private val repository: PlayerWeaponRepository) {
    @PostMapping
    fun create(@Valid @RequestBody req: CreatePlayerWeaponRequest): ResponseEntity<Void> {
        val entity =
                PlayerWeapon(
                        playerId = req.playerId,
                        weaponId = req.weaponId,
                        weaponLevel = req.level
                )
        repository.save(entity)
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }

    @GetMapping("/{playerId}/{weaponId}")
    fun getById(
            @PathVariable playerId: Int,
            @PathVariable weaponId: String
    ): ResponseEntity<PlayerWeaponResponse> {
        val found = repository.findByPlayerIdAndWeaponId(playerId, weaponId)
        return if (found != null) {
            ResponseEntity.ok(PlayerWeaponResponse(id = found.weaponId, level = found.weaponLevel))
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @PutMapping("/{playerId}/{weaponId}")
    fun update(
            @PathVariable playerId: Int,
            @PathVariable weaponId: String,
            @Valid @RequestBody req: UpdatePlayerWeaponRequest
    ): ResponseEntity<Void> {
        val found =
                repository.findByPlayerIdAndWeaponId(playerId, weaponId)
                        ?: return ResponseEntity.notFound().build()

        req.level?.let { found.weaponLevel = it }

        repository.save(found)
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{playerId}/{weaponId}")
    fun delete(@PathVariable playerId: Int, @PathVariable weaponId: String): ResponseEntity<Void> {
        val found =
                repository.findByPlayerIdAndWeaponId(playerId, weaponId)
                        ?: return ResponseEntity.notFound().build()

        repository.delete(found)
        return ResponseEntity.noContent().build()
    }
}
