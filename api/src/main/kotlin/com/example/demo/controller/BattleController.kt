package com.example.demo.controller

import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.BattleStatusResponse
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
        private val battleStatusEffectRepository: BattleStatusEffectRepository,
        private val attackRepository: AttackRepository,
        private val playerPictoRepository: PlayerPictoRepository,
        private val playerLuminaRepository: PlayerLuminaRepository
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

                    val status =
                            battleStatusEffectRepository.findByBattleCharacterId(bc.id!!).map { eff
                                ->
                                BattleStatusResponse(
                                        effectName = eff.effectType,
                                        remainingTurns = eff.remainingTurns,
                                        ammount = eff.ammount,
                                        isResolved = eff.isResolved
                                )
                            }

                    BattleCharacterInfo(
                            battleID = bc.id,
                            id = externalId,
                            name = bc.characterName,
                            healthPoints = bc.healthPoints,
                            maxHealthPoints = bc.maxHealthPoints,
                            magicPoints = bc.magicPoints,
                            maxMagicPoints = bc.maxMagicPoints,
                            chargePoints = bc.chargePoints,
                            maxChargePoints = bc.maxChargePoints,
                            sunCharges = bc.sunCharges,
                            moonCharges = bc.moonCharges,
                            gradientPoints = if (bc.isEnemy) battle.teamBGradientPoints else battle.teamAGradientPoints,
                            stance = bc.stance,
                            status = status,
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
                if (battleLogId != null) {
                    allLogs.filter { log -> log.id?.let { it > battleLogId } == true }
                } else {
                    val last = allLogs.lastOrNull()
                    if (last != null) listOf(last) else emptyList()
                }

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

    @Transactional
    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody updated: Battle): ResponseEntity<Battle> {
        val opt = battleRepository.findById(id)
        return if (opt.isPresent) {
            val existing = opt.get()
            val newBattle = existing.copy(battleStatus = updated.battleStatus)
            battleRepository.save(newBattle)

            // Incrementar battle_count dos pictos quando a batalha termina
            if (updated.battleStatus == "finished") {
                val battleCharacters = battleCharacterRepository.findByBattleId(id)
                val playerCharacters = battleCharacters.filter { it.characterType == "player" }

                playerCharacters.forEach { bc ->
                    val playerId = bc.externalId.toIntOrNull()

                    if (playerId != null) {
                        val player = playerRepository.findById(playerId).orElse(null)

                        if (player != null && player.hpCurrent > 0) {
                            val playerPictos = playerPictoRepository.findByPlayerId(playerId)
                            val slottedPictos = playerPictos.filter { it.slot != null }

                            slottedPictos.forEach { picto ->
                                val oldBattleCount = picto.battleCount
                                val newBattleCount = oldBattleCount + 1

                                // Atualizar o battleCount
                                val updatedPicto = picto.copy(battleCount = newBattleCount)
                                playerPictoRepository.save(updatedPicto)

                                // Se passou de 2 para 3, criar a lumina
                                if (oldBattleCount == 2 && newBattleCount == 3) {
                                    val existingLumina = playerLuminaRepository.findByPlayerIdAndPictoId(playerId, picto.pictoId)

                                    if (existingLumina == null) {
                                        val newLumina = com.example.demo.model.PlayerLumina(
                                            playerId = playerId,
                                            pictoId = picto.pictoId,
                                            isEquiped = false
                                        )
                                        playerLuminaRepository.save(newLumina)
                                    }
                                }
                            }
                        }
                    }
                }

                battleLogRepository.save(
                        BattleLog(battleId = id, eventType = "BATTLE_FINISHED", eventJson = null)
                )
            }

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

    @PostMapping("/flee")
    @Transactional
    fun flee(@RequestBody body: Map<String, Int>): ResponseEntity<Void> {
        val playerBattleId = body["playerBattleId"] ?: return ResponseEntity.badRequest().build()

        val playerCharacter =
                battleCharacterRepository.findById(playerBattleId).orElse(null)
                        ?: return ResponseEntity.notFound().build()

        val battleId = playerCharacter.battleId ?: return ResponseEntity.badRequest().build()

        val allCharacters = battleCharacterRepository.findByBattleId(battleId)
        val teamMembers = allCharacters.filter { it.isEnemy == playerCharacter.isEnemy }

        teamMembers.forEach { member ->
            val remainingTurns = if (member.id == playerBattleId) 1 else null
            val statusEffect = com.example.demo.model.BattleStatusEffect(
                    battleCharacterId = member.id!!,
                    effectType = "Fleeing",
                    ammount = 0,
                    remainingTurns = remainingTurns,
                    isResolved = true
            )
            battleStatusEffectRepository.save(statusEffect)
        }

        battleLogRepository.save(
                BattleLog(battleId = battleId, eventType = "FLEEING", eventJson = null)
        )

        return ResponseEntity.noContent().build()
    }
}
