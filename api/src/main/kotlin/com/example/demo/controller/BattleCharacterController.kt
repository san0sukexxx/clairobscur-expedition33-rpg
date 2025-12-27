package com.example.demo.controller

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.dto.UpdateHpRequest
import com.example.demo.dto.UpdateMpRequest
import com.example.demo.dto.UpdateStanceRequest
import com.example.demo.dto.UpdateStainsRequest
import com.example.demo.dto.UpdateRankRequest
import com.example.demo.dto.UpdateAPRequest
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

    @PutMapping("/characters/{id}/mp")
    fun updateCharacterMp(
            @PathVariable id: Int,
            @RequestBody body: UpdateMpRequest
    ): ResponseEntity<Void> {
        service.updateCharacterMp(id, body.newMp)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/stance")
    fun updateCharacterStance(
            @PathVariable id: Int,
            @RequestBody body: UpdateStanceRequest
    ): ResponseEntity<Void> {
        service.updateCharacterStance(id, body.newStance)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/stains")
    fun updateCharacterStains(
            @PathVariable id: Int,
            @RequestBody body: UpdateStainsRequest
    ): ResponseEntity<Void> {
        service.updateCharacterStains(id, body.stainSlot1, body.stainSlot2, body.stainSlot3, body.stainSlot4)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/rank")
    fun updateCharacterRank(
            @PathVariable id: Int,
            @RequestBody body: UpdateRankRequest
    ): ResponseEntity<Void> {
        service.updateCharacterRank(id, body.perfectionRank, body.rankProgress)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/characters/{id}/rank-up")
    fun rankUpCharacter(@PathVariable id: Int): ResponseEntity<Map<String, Boolean>> {
        val success = service.rankUpCharacter(id)
        return ResponseEntity.ok(mapOf("success" to success))
    }

    @PostMapping("/characters/{id}/rank-down")
    fun rankDownCharacter(@PathVariable id: Int): ResponseEntity<Map<String, Boolean>> {
        val success = service.rankDownCharacter(id)
        return ResponseEntity.ok(mapOf("success" to success))
    }

    @PostMapping("/characters/{id}/ap")
    fun updateCharacterAP(
            @PathVariable id: Int,
            @RequestBody body: UpdateAPRequest
    ): ResponseEntity<Void> {
        service.updateCharacterAP(id, body.amount)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/characters/{id}/ap")
    fun getCharacterAP(@PathVariable id: Int): ResponseEntity<Map<String, Int?>> {
        val ap = service.getCharacterAP(id)
        return ResponseEntity.ok(ap)
    }
}
