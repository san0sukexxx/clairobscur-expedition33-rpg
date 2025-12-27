package com.example.demo.controller

import com.example.demo.model.DamageModifier
import com.example.demo.service.DamageModifierService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class AddModifierRequest(
    val modifierType: String,
    val multiplier: Double,
    val flatBonus: Int = 0,
    val conditionType: String? = null
)

@RestController
@RequestMapping("/api/battle/characters")
class DamageModifierController(
    private val damageModifierService: DamageModifierService
) {

    @GetMapping("/{battleCharacterId}/modifiers")
    fun getModifiers(@PathVariable battleCharacterId: Int): ResponseEntity<List<DamageModifier>> {
        val modifiers = damageModifierService.getModifiers(battleCharacterId)
        return ResponseEntity.ok(modifiers)
    }

    @GetMapping("/{battleCharacterId}/modifiers/active")
    fun getActiveModifiers(@PathVariable battleCharacterId: Int): ResponseEntity<List<DamageModifier>> {
        val modifiers = damageModifierService.getActiveModifiers(battleCharacterId)
        return ResponseEntity.ok(modifiers)
    }

    @PostMapping("/{battleCharacterId}/modifiers")
    fun addModifier(
        @PathVariable battleCharacterId: Int,
        @RequestBody request: AddModifierRequest
    ): ResponseEntity<DamageModifier> {
        val modifier = damageModifierService.addModifier(
            battleCharacterId = battleCharacterId,
            type = request.modifierType,
            multiplier = request.multiplier,
            flatBonus = request.flatBonus,
            condition = request.conditionType
        )
        return ResponseEntity.ok(modifier)
    }

    @DeleteMapping("/modifiers/{modifierId}")
    fun removeModifier(@PathVariable modifierId: Int): ResponseEntity<Void> {
        damageModifierService.removeModifier(modifierId)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/modifiers/{modifierId}/activate")
    fun activateModifier(@PathVariable modifierId: Int): ResponseEntity<Void> {
        damageModifierService.activateModifier(modifierId)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/modifiers/{modifierId}/deactivate")
    fun deactivateModifier(@PathVariable modifierId: Int): ResponseEntity<Void> {
        damageModifierService.deactivateModifier(modifierId)
        return ResponseEntity.noContent().build()
    }
}
