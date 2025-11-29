package com.example.demo.controller

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.dto.UpdateHpRequest
import com.example.demo.model.BattleCharacter
import com.example.demo.service.BattleCharacterService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battles")
class BattleCharacterController(private val service: BattleCharacterService) {

    @PostMapping("/{battleId}/characters")
    fun addCharacter(
            @PathVariable battleId: Int,
            @RequestBody @Valid body: AddBattleCharacterRequest
    ): ResponseEntity<Map<String, Int>> {
        val id = service.addCharacter(battleId, body)
        return ResponseEntity.ok(mapOf("id" to id))
    }

    @GetMapping("/{battleId}/characters")
    fun listCharacters(@PathVariable battleId: Int): ResponseEntity<List<BattleCharacter>> {
        val characters = service.listCharacters(battleId)
        return ResponseEntity.ok(characters)
    }

    @DeleteMapping("/characters/{id}")
    fun removeCharacter(@PathVariable id: Int): ResponseEntity<Void> {
        service.removeCharacter(id)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/hp")
    fun updateCharacterHp(
            @PathVariable id: Int,
            @RequestBody body: UpdateHpRequest
    ): ResponseEntity<Void> {
        service.updateCharacterHp(id, body.newHp)
        return ResponseEntity.noContent().build()
    }
}
