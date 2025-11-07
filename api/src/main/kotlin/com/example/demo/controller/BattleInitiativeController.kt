package com.example.demo.controller

import com.example.demo.dto.CreateBattleInitiativeRequest
import com.example.demo.dto.InitiativeResponse
import com.example.demo.model.BattleInitiative
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.InitiativeRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle-initiatives")
class BattleInitiativeController(
        private val initiativeRepository: InitiativeRepository,
        private val battleCharacterRepository: BattleCharacterRepository
) {

        @PostMapping
        @Transactional
        fun create(
                @RequestBody body: CreateBattleInitiativeRequest
        ): ResponseEntity<InitiativeResponse> {
                val bc =
                        battleCharacterRepository.findById(body.battleCharacterId).orElse(null)
                                ?: return ResponseEntity.badRequest().build()

                val existing = initiativeRepository.findByBattleCharacterId(body.battleCharacterId)

                val saved =
                        if (existing != null) {
                                existing.initiativeValue = body.value
                                existing.hability = body.hability
                                existing.playFirst = body.playFirst ?: existing.playFirst
                                initiativeRepository.save(existing)
                        } else {
                                initiativeRepository.save(
                                        BattleInitiative(
                                                battleId = bc.battleId,
                                                battleCharacterId = body.battleCharacterId,
                                                initiativeValue = body.value,
                                                hability = body.hability,
                                                playFirst = body.playFirst ?: false
                                        )
                                )
                        }

                bc.canRollInitiative = false
                battleCharacterRepository.save(bc)

                val response =
                        InitiativeResponse(
                                playFirst = saved.playFirst,
                                battleID = saved.battleCharacterId,
                                value = saved.initiativeValue,
                                hability = saved.hability
                        )

                val status = if (existing == null) HttpStatus.CREATED else HttpStatus.OK
                return ResponseEntity.status(status).body(response)
        }
}
