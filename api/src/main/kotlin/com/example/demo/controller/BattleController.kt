package com.example.demo.controller

import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.BattleWithDetailsResponse
import com.example.demo.dto.InitiativeResponse
import com.example.demo.dto.UpdateBattleStatusRequest
import com.example.demo.dto.UseBattleRequest
import com.example.demo.model.Battle
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.*
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/battles")
class BattleController(
        private val battleRepository: BattleRepository,
        private val campaignRepository: CampaignRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val playerRepository: PlayerRepository,
        private val battleInitiativeRepository: BattleInitiativeRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val attackRepository: AttackRepository
) {

    @GetMapping("/{battleId}")
    fun getBattleById(
            @PathVariable battleId: Int,
            @RequestParam(required = false) battleLogId: Int?
    ): ResponseEntity<BattleWithDetailsResponse> {
        val opt = battleRepository.findById(battleId)
        if (!opt.isPresent) return ResponseEntity.notFound().build()

        val battle = opt.get()

        val characterEntities = battleCharacterRepository.findByBattleId(battleId)
        val characters =
                characterEntities.map { bc ->
                    val playerIdFromExternal = bc.externalId.toIntOrNull()
                    val externalId =
                            if (bc.characterType == "player") {
                                playerIdFromExternal?.let { pid ->
                                    playerRepository.findById(pid).orElse(null)?.characterId
                                }
                                        ?: bc.externalId
                            } else {
                                bc.externalId
                            }

                    BattleCharacterInfo(
                            battleID = bc.id,
                            id = externalId,
                            name = bc.characterName,
                            healthPoints = bc.healthPoints,
                            maxHealthPoints = bc.maxHealthPoints,
                            magicPoints = bc.magicPoints,
                            maxMagicPoints = bc.maxMagicPoints,
                            status = null,
                            type = bc.characterType,
                            isEnemy = bc.isEnemy,
                            canRollInitiative = bc.canRollInitiative
                    )
                }

        val initiatives =
                battleInitiativeRepository.findByBattleId(battleId).map {
                    InitiativeResponse(
                            playFirst = it.playFirst,
                            battleID = it.battleCharacterId,
                            value = it.initiativeValue,
                            hability = it.hability
                    )
                }

        val turns =
                battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId).map { t ->
                    BattleTurnResponse(
                            id = t.id!!,
                            battleId = t.battleId,
                            playOrder = t.playOrder,
                            battleCharacterId = t.battleCharacterId
                    )
                }

        val allLogs = battleLogRepository.findByBattleIdOrderByIdAsc(battleId)
        val battleLogs =
                if (battleLogId != null)
                        allLogs.filter { log -> log.id?.let { it > battleLogId } == true }
                else allLogs

        val attacks = attackRepository.findByBattleId(battleId)

        val response =
                BattleWithDetailsResponse(
                        id = battle.id!!,
                        campaignId = battle.campaignId,
                        battleStatus = battle.battleStatus,
                        characters = characters,
                        initiatives = initiatives,
                        turns = turns,
                        battleLogs = battleLogs,
                        attacks = attacks
                )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/campaign/{campaignId}")
    fun getBattlesByCampaign(@PathVariable campaignId: Int): ResponseEntity<List<Battle>> {
        val battles = battleRepository.findByCampaignId(campaignId)
        return ResponseEntity.ok(battles)
    }

    @PostMapping
    fun create(@RequestBody battle: Battle): ResponseEntity<Int> {
        val saved = battleRepository.save(battle)

        val campaign =
                campaignRepository.findById(battle.campaignId).orElseThrow {
                    IllegalArgumentException("Campaign not found with id: ${battle.campaignId}")
                }

        campaign.battleId = battle.id
        campaignRepository.save(campaign)

        return ResponseEntity.ok(saved.id!!)
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody updated: Battle): ResponseEntity<Battle> {
        val opt = battleRepository.findById(id)
        return if (opt.isPresent) {
            val existing = opt.get()
            val newBattle = existing.copy(battleStatus = updated.battleStatus)
            battleRepository.save(newBattle)
            ResponseEntity.ok().build()
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @Transactional
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Unit> {
        if (!battleRepository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }

        battleRepository.deleteById(id)

        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{battleId}/use")
    fun useBattle(
            @PathVariable battleId: Int,
            @RequestBody body: UseBattleRequest
    ): ResponseEntity<Void> {
        val campaignId = body.campaignId

        val campaign =
                campaignRepository.findById(campaignId).orElseThrow {
                    IllegalArgumentException("Campaign not found with id: $campaignId")
                }

        campaign.battleId = battleId
        campaignRepository.save(campaign)

        return ResponseEntity.ok().build()
    }

    @PutMapping("/clear")
    fun clearBattle(@RequestBody body: UseBattleRequest): ResponseEntity<Void> {
        val campaignId = body.campaignId

        val campaign =
                campaignRepository.findById(campaignId).orElseThrow {
                    IllegalArgumentException("Campaign not found with id: $campaignId")
                }

        campaign.battleId = null
        campaignRepository.save(campaign)

        return ResponseEntity.ok().build()
    }

    @PostMapping("/{battleId}/start")
    @Transactional
    fun startBattle(
            @PathVariable battleId: Int,
            @RequestBody body: UpdateBattleStatusRequest
    ): ResponseEntity<Void> {
        val battle =
                battleRepository.findById(battleId).orElse(null)
                        ?: return ResponseEntity.notFound().build()

        val existingTurns = battleTurnRepository.findByBattleId(battleId)
        if (existingTurns.isNotEmpty()) {
            battleTurnRepository.deleteAllInBatch(existingTurns)
        }

        if (body.battleStatus == "started") {
            val initiatives = battleInitiativeRepository.findByBattleId(battleId)
            val ordered =
                    initiatives.sortedWith(
                            compareByDescending<com.example.demo.model.BattleInitiative> {
                                it.playFirst
                            }
                                    .thenByDescending { it.initiativeValue }
                                    .thenBy { it.battleCharacterId }
                    )
            val turnsToSave =
                    ordered.mapIndexed { index, ini ->
                        BattleTurn(
                                battleId = battleId,
                                battleCharacterId = ini.battleCharacterId,
                                playOrder = index + 1
                        )
                    }
            if (turnsToSave.isNotEmpty()) {
                battleTurnRepository.saveAll(turnsToSave)
            }

            battleLogRepository.save(
                    BattleLog(battleId = battleId, eventType = "BATTLE_STARTED", eventJson = null)
            )
        }

        battle.battleStatus = body.battleStatus
        battleRepository.save(battle)

        return ResponseEntity.noContent().build()
    }
}
