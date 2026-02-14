package com.example.demo.controller

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.dto.AddPerfectionRequest
import com.example.demo.dto.UpdateHpRequest
import com.example.demo.dto.UpdateMpRequest
import com.example.demo.dto.UpdateStanceRequest
import com.example.demo.dto.UpdateStainsRequest
import com.example.demo.dto.UpdateRankRequest
import com.example.demo.dto.UpdateAPRequest
import com.example.demo.dto.UpdateNewAPRequest
import com.example.demo.dto.UpdateGradientRequest
import com.example.demo.dto.UpdateChargePointsRequest
import com.example.demo.dto.IncrementSunMoonRequest
import com.example.demo.dto.UpdateSunMoonChargesRequest
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

    @PutMapping("/characters/{id}/max-hp")
    fun updateCharacterMaxHp(
            @PathVariable id: Int,
            @RequestBody body: UpdateHpRequest
    ): ResponseEntity<Void> {
        service.updateCharacterMaxHp(id, body.newHp)
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

    @PutMapping("/characters/{id}/ap")
    fun updateCharacterAP(
            @PathVariable id: Int,
            @RequestBody body: UpdateNewAPRequest
    ): ResponseEntity<Void> {
        service.updateCharacterAPDirect(id, body.newAP)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/gradient")
    fun updateCharacterGradient(
            @PathVariable id: Int,
            @RequestBody body: UpdateGradientRequest
    ): ResponseEntity<Void> {
        service.updateCharacterGradient(id, body.newGradient)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/charge-points")
    fun updateCharacterChargePoints(
            @PathVariable id: Int,
            @RequestBody body: UpdateChargePointsRequest
    ): ResponseEntity<Void> {
        service.updateCharacterChargePoints(id, body.newChargePoints)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/characters/{id}/increment-sun-moon")
    fun incrementSunMoonCharge(
            @PathVariable id: Int,
            @RequestBody body: IncrementSunMoonRequest
    ): ResponseEntity<Map<String, Any>> {
        val result = service.incrementSunMoonCharge(id, body.skillType)
        return ResponseEntity.ok(mapOf("twilightActivated" to result.activated, "twilightCharges" to result.charges))
    }

    @PostMapping("/characters/{id}/increment-foretell-consumed")
    fun incrementForetellConsumed(
            @PathVariable id: Int,
            @RequestBody body: Map<String, Int>
    ): ResponseEntity<Void> {
        val amount = body["amount"] ?: 0
        if (amount > 0) {
            service.incrementForetellConsumed(id, amount)
        }
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/characters/{id}/sun-moon-charges")
    fun updateSunMoonCharges(
            @PathVariable id: Int,
            @RequestBody body: UpdateSunMoonChargesRequest
    ): ResponseEntity<Void> {
        service.updateCharacterSunMoonCharges(id, body.sunCharges, body.moonCharges)
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

    @PostMapping("/characters/{id}/add-perfection")
    fun addPerfectionPoints(
            @PathVariable id: Int,
            @RequestBody body: AddPerfectionRequest
    ): ResponseEntity<Map<String, Any>> {
        val result = service.addPerfectionPoints(id, body.points)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/characters/{id}/mp")
    fun giveMP(
            @PathVariable id: Int,
            @RequestBody body: UpdateAPRequest
    ): ResponseEntity<Void> {
        service.updateCharacterAP(id, body.amount)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/characters/{id}/mp")
    fun getMP(@PathVariable id: Int): ResponseEntity<Map<String, Int?>> {
        val ap = service.getCharacterAP(id)
        return ResponseEntity.ok(ap)
    }

    @PutMapping("/characters/{id}/bestial-wheel-position")
    fun updateBestialWheelPosition(
            @PathVariable id: Int,
            @RequestBody body: Map<String, Int>
    ): ResponseEntity<Void> {
        val newPosition = body["newPosition"] ?: return ResponseEntity.badRequest().build()
        service.updateBestialWheelPosition(id, newPosition)
        return ResponseEntity.noContent().build()
    }
}
