package com.example.demo.controller

import com.example.demo.dto.CreateDefenseRequest
import com.example.demo.model.BattleLog
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PlayerRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/defenses")
class DefenseController(
        private val attackRepository: AttackRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val playerRepository: PlayerRepository
) {

    @PostMapping
    @Transactional
    fun defendFromAttack(@RequestBody body: CreateDefenseRequest): ResponseEntity<Void> {
        if (body.attackId == null || body.totalDamage == null) {
            return ResponseEntity.badRequest().build()
        }

        val attack =
                attackRepository.findById(body.attackId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        if (attack.isResolved) {
            return ResponseEntity.noContent().build()
        }

        val targetBC =
                battleCharacterRepository.findById(attack.targetBattleId).orElse(null)
                        ?: return ResponseEntity.badRequest().build()

        val damage = body.totalDamage.coerceAtLeast(0)
        val newHp = (targetBC.healthPoints - damage).coerceAtLeast(0)

        targetBC.healthPoints = newHp

        if (newHp == 0) {
            if (targetBC.magicPoints != null) {
                targetBC.magicPoints = 0
            }

            val turns = battleTurnRepository.findByBattleCharacterId(targetBC.id!!)
            if (turns.isNotEmpty()) {
                battleTurnRepository.deleteAllInBatch(turns)
            }
        }

        battleCharacterRepository.save(targetBC)

        val playerId = targetBC.externalId.toIntOrNull()
        if (playerId != null) {
            val player = playerRepository.findById(playerId).orElse(null)
            if (player != null) {
                player.hpCurrent = targetBC.healthPoints
                if (targetBC.magicPoints != null) {
                    player.mpCurrent = targetBC.magicPoints!!
                }
                playerRepository.save(player)
            }
        }

        attack.totalDefended = body.totalDamage
        attack.isResolved = true
        attackRepository.save(attack)

        battleLogRepository.save(
                BattleLog(battleId = attack.battleId, eventType = "DAMAGE_DEALT", eventJson = null)
        )

        return ResponseEntity.noContent().build()
    }
}
