package com.example.demo.controller

import com.example.demo.dto.CanActivateResponse
import com.example.demo.dto.PictoEffectTrackerResponse
import com.example.demo.dto.ResetTurnRequest
import com.example.demo.dto.TrackEffectRequest
import com.example.demo.model.BattleLog
import com.example.demo.repository.BattleLogRepository
import com.example.demo.service.PictoEffectTrackerService
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battle/picto-effects")
class PictoEffectTrackerController(
        private val pictoEffectTrackerService: PictoEffectTrackerService,
        private val battleLogRepository: BattleLogRepository,
        private val objectMapper: ObjectMapper
) {

    /**
     * POST /api/battle/picto-effects/track
     * Registrar ativação de efeito
     */
    @PostMapping("/track")
    @Transactional
    fun trackEffect(@RequestBody request: TrackEffectRequest): ResponseEntity<PictoEffectTrackerResponse> {
        // Verificar se pode ativar
        val canActivate = pictoEffectTrackerService.canActivate(
                request.battleId,
                request.battleCharacterId,
                request.pictoName,
                request.effectType
        )

        if (!canActivate) {
            return ResponseEntity.badRequest().build()
        }

        // Registrar ativação
        val tracker = pictoEffectTrackerService.track(
                request.battleId,
                request.battleCharacterId,
                request.pictoName,
                request.effectType
        )

        // Log da ativação
        val eventJson = objectMapper.writeValueAsString(
                mapOf(
                        "battleCharacterId" to request.battleCharacterId,
                        "pictoName" to request.pictoName,
                        "effectType" to request.effectType,
                        "timesTriggered" to tracker.timesTriggered
                )
        )

        battleLogRepository.save(
                BattleLog(
                        battleId = request.battleId,
                        eventType = "PICTO_EFFECT_TRACKED",
                        eventJson = eventJson
                )
        )

        val response = PictoEffectTrackerResponse(
                id = tracker.id!!,
                battleId = tracker.battleId,
                battleCharacterId = tracker.battleCharacterId,
                pictoName = tracker.pictoName,
                effectType = tracker.effectType,
                timesTriggered = tracker.timesTriggered,
                lastTurnTriggered = tracker.lastTurnTriggered,
                resetOnTurnEnd = tracker.resetOnTurnEnd
        )

        return ResponseEntity.ok(response)
    }

    /**
     * POST /api/battle/picto-effects/can-activate
     * Verificar se efeito pode ser ativado
     */
    @PostMapping("/can-activate")
    fun canActivate(@RequestBody request: TrackEffectRequest): ResponseEntity<Boolean> {
        val canActivate = pictoEffectTrackerService.canActivate(
                request.battleId,
                request.battleCharacterId,
                request.pictoName,
                request.effectType
        )

        return ResponseEntity.ok(canActivate)
    }

    /**
     * GET /api/battle/picto-effects/check/{battleCharacterId}/{pictoName}
     * Verificar se efeito pode ser ativado
     */
    @GetMapping("/check/{battleCharacterId}/{pictoName}")
    fun checkCanActivate(
            @PathVariable battleCharacterId: Int,
            @PathVariable pictoName: String,
            @RequestParam battleId: Int,
            @RequestParam effectType: String
    ): ResponseEntity<CanActivateResponse> {
        val canActivate = pictoEffectTrackerService.canActivate(
                battleId,
                battleCharacterId,
                pictoName,
                effectType
        )

        val tracker = pictoEffectTrackerService.getTracker(
                battleId,
                battleCharacterId,
                pictoName
        )

        val response = CanActivateResponse(
                canActivate = canActivate,
                timesTriggered = tracker?.timesTriggered ?: 0,
                lastTurnTriggered = tracker?.lastTurnTriggered
        )

        return ResponseEntity.ok(response)
    }

    /**
     * POST /api/battle/picto-effects/reset-turn/{battleId}
     * Resetar efeitos "once per turn" ao fim do turno
     */
    @PostMapping("/reset-turn/{battleId}")
    @Transactional
    fun resetTurn(
            @PathVariable battleId: Int,
            @RequestBody(required = false) request: ResetTurnRequest?
    ): ResponseEntity<Void> {
        pictoEffectTrackerService.resetTurn(
                battleId,
                request?.battleCharacterId
        )

        // Log do reset
        val eventJson = objectMapper.writeValueAsString(
                mapOf(
                        "battleId" to battleId,
                        "battleCharacterId" to request?.battleCharacterId,
                        "action" to "reset_turn"
                )
        )

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "PICTO_EFFECTS_RESET",
                        eventJson = eventJson
                )
        )

        return ResponseEntity.noContent().build()
    }

    /**
     * GET /api/battle/picto-effects/battle/{battleId}
     * Listar todos os trackers de uma batalha
     */
    @GetMapping("/battle/{battleId}")
    fun listByBattle(@PathVariable battleId: Int): ResponseEntity<List<PictoEffectTrackerResponse>> {
        val trackers = pictoEffectTrackerService.listTrackersByBattle(battleId)

        val responses = trackers.map { tracker ->
            PictoEffectTrackerResponse(
                    id = tracker.id!!,
                    battleId = tracker.battleId,
                    battleCharacterId = tracker.battleCharacterId,
                    pictoName = tracker.pictoName,
                    effectType = tracker.effectType,
                    timesTriggered = tracker.timesTriggered,
                    lastTurnTriggered = tracker.lastTurnTriggered,
                    resetOnTurnEnd = tracker.resetOnTurnEnd
            )
        }

        return ResponseEntity.ok(responses)
    }

    /**
     * GET /api/battle/picto-effects/character/{battleCharacterId}
     * Listar todos os trackers de um personagem
     */
    @GetMapping("/character/{battleCharacterId}")
    fun listByCharacter(@PathVariable battleCharacterId: Int): ResponseEntity<List<PictoEffectTrackerResponse>> {
        val trackers = pictoEffectTrackerService.listTrackersByCharacter(battleCharacterId)

        val responses = trackers.map { tracker ->
            PictoEffectTrackerResponse(
                    id = tracker.id!!,
                    battleId = tracker.battleId,
                    battleCharacterId = tracker.battleCharacterId,
                    pictoName = tracker.pictoName,
                    effectType = tracker.effectType,
                    timesTriggered = tracker.timesTriggered,
                    lastTurnTriggered = tracker.lastTurnTriggered,
                    resetOnTurnEnd = tracker.resetOnTurnEnd
            )
        }

        return ResponseEntity.ok(responses)
    }

    /**
     * DELETE /api/battle/picto-effects/clear/{battleId}
     * Limpar todos os trackers de uma batalha
     */
    @DeleteMapping("/clear/{battleId}")
    @Transactional
    fun clearBattle(@PathVariable battleId: Int): ResponseEntity<Void> {
        pictoEffectTrackerService.clearBattle(battleId)

        battleLogRepository.save(
                BattleLog(
                        battleId = battleId,
                        eventType = "PICTO_EFFECTS_CLEARED",
                        eventJson = null
                )
        )

        return ResponseEntity.noContent().build()
    }

    /**
     * GET /api/battle/picto-effects/tracker/{battleId}/{battleCharacterId}/{pictoName}
     * Obter informações de um tracker específico
     */
    @GetMapping("/tracker/{battleId}/{battleCharacterId}/{pictoName}")
    fun getTracker(
            @PathVariable battleId: Int,
            @PathVariable battleCharacterId: Int,
            @PathVariable pictoName: String
    ): ResponseEntity<PictoEffectTrackerResponse> {
        val tracker = pictoEffectTrackerService.getTracker(
                battleId,
                battleCharacterId,
                pictoName
        ) ?: return ResponseEntity.notFound().build()

        val response = PictoEffectTrackerResponse(
                id = tracker.id!!,
                battleId = tracker.battleId,
                battleCharacterId = tracker.battleCharacterId,
                pictoName = tracker.pictoName,
                effectType = tracker.effectType,
                timesTriggered = tracker.timesTriggered,
                lastTurnTriggered = tracker.lastTurnTriggered,
                resetOnTurnEnd = tracker.resetOnTurnEnd
        )

        return ResponseEntity.ok(response)
    }
}
