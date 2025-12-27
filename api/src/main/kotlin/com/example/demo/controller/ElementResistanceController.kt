package com.example.demo.controller

import com.example.demo.dto.AddResistanceRequest
import com.example.demo.model.ElementResistance
import com.example.demo.service.ElementResistanceService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle/characters")
class ElementResistanceController(
        private val elementResistanceService: ElementResistanceService
) {

    /**
     * Add or update an elemental resistance for a battle character.
     * POST /api/battle/characters/{id}/resistances
     */
    @PostMapping("/{id}/resistances")
    @Transactional
    fun addResistance(
            @PathVariable id: Int,
            @RequestBody request: AddResistanceRequest
    ): ResponseEntity<Void> {
        elementResistanceService.addResistance(
                battleCharacterId = id,
                element = request.element,
                resistanceType = request.resistanceType,
                multiplier = request.multiplier
        )
        return ResponseEntity.noContent().build()
    }

    /**
     * Get all elemental resistances for a battle character.
     * GET /api/battle/characters/{id}/resistances
     */
    @GetMapping("/{id}/resistances")
    fun getResistances(@PathVariable id: Int): ResponseEntity<List<ElementResistance>> {
        val resistances = elementResistanceService.getResistances(id)
        return ResponseEntity.ok(resistances)
    }

    /**
     * Delete an elemental resistance for a specific element.
     * DELETE /api/battle/characters/{id}/resistances/{element}
     */
    @DeleteMapping("/{id}/resistances/{element}")
    @Transactional
    fun deleteResistance(
            @PathVariable id: Int,
            @PathVariable element: String
    ): ResponseEntity<Void> {
        elementResistanceService.removeResistance(id, element)
        return ResponseEntity.noContent().build()
    }
}
