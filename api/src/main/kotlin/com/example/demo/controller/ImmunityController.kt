package com.example.demo.controller

import com.example.demo.dto.AddImmunityRequest
import com.example.demo.model.StatusImmunity
import com.example.demo.service.ImmunityService
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle/characters")
class ImmunityController(
        private val immunityService: ImmunityService
) {

    /**
     * Add an immunity or resistance to a battle character.
     * POST /api/battle/characters/{id}/immunities
     */
    @PostMapping("/{id}/immunities")
    @Transactional
    fun addImmunity(
            @PathVariable id: Int,
            @RequestBody request: AddImmunityRequest
    ): ResponseEntity<Void> {
        immunityService.addImmunity(
                battleCharacterId = id,
                statusType = request.statusType,
                immunityType = request.immunityType,
                resistChance = request.resistChance
        )
        return ResponseEntity.noContent().build()
    }

    /**
     * Get all immunities for a battle character.
     * GET /api/battle/characters/{id}/immunities
     */
    @GetMapping("/{id}/immunities")
    fun getImmunities(@PathVariable id: Int): ResponseEntity<List<StatusImmunity>> {
        val immunities = immunityService.getImmunities(id)
        return ResponseEntity.ok(immunities)
    }

    /**
     * Delete an immunity for a specific status type.
     * DELETE /api/battle/characters/{id}/immunities/{statusType}
     */
    @DeleteMapping("/{id}/immunities/{statusType}")
    @Transactional
    fun deleteImmunity(
            @PathVariable id: Int,
            @PathVariable statusType: String
    ): ResponseEntity<Void> {
        immunityService.removeImmunity(id, statusType)
        return ResponseEntity.noContent().build()
    }
}
