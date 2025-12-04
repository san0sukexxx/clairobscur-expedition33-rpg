package com.example.demo.controller

import com.example.demo.dto.*
import com.example.demo.model.BattleLog
import com.example.demo.model.CampaignPlayer
import com.example.demo.model.Player
import com.example.demo.model.PlayerPicto
import com.example.demo.model.PlayerLumina
import com.example.demo.repository.*
import com.example.demo.service.FightService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/players")
class PlayerController(
        private val playerRepository: PlayerRepository,
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerWeaponRepository: PlayerWeaponRepository,
        private val battleRepository: BattleRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository,
        private val playerPictoRepository: PlayerPictoRepository,
        private val playerLuminaRepository: PlayerLuminaRepository,
        private val fightService: FightService
) {

        @PostMapping
        fun create(@RequestBody req: CreatePlayerRequest): ResponseEntity<CreatePlayerResponse> {
                val player =
                        playerRepository.save(
                                Player(
                                        name = null,
                                        characterId = null,
                                        totalPoints = 0,
                                        xp = 0,
                                        power = 0,
                                        hability = 0,
                                        resistance = 0,
                                        apCurrent = 0,
                                        mpCurrent = 0,
                                        hpCurrent = 0,
                                        notes = null
                                )
                        )

                val playerId = player.id ?: error("Persist failed: player id not generated")

                campaignPlayerRepository.save(
                        CampaignPlayer(campaignId = req.campaign, playerId = playerId)
                )

                return ResponseEntity.ok(CreatePlayerResponse(id = playerId))
        }

        @GetMapping
        fun list(): ResponseEntity<List<GetPlayerResponse>> {
                val players = playerRepository.findAll()

                val response =
                        players.map { player ->
                                val pid = player.id ?: 0

                                GetPlayerResponse(
                                        id = pid,
                                        playerSheet = PlayerSheetResponse.fromEntity(player),
                                        weapons = null,
                                        fightInfo = null,
                                        isMasterEditing = null,
                                        battleLogs = null,
                                        pictos = null,
                                        luminas = null
                                )
                        }

                return ResponseEntity.ok(response)
        }

        @GetMapping("/{id}")
        fun getById(
                @PathVariable id: Int,
                @RequestParam(required = false) battleLogId: Int?
        ): ResponseEntity<GetPlayerResponse> {

                val playerOpt = playerRepository.findById(id)
                if (playerOpt.isEmpty) return ResponseEntity.notFound().build()

                val entity = playerOpt.get()

                val weapons =
                        playerWeaponRepository.findByPlayerId(id).map { pw ->
                                PlayerWeaponResponse(id = pw.weaponId, level = pw.weaponLevel)
                        }

                val fightInfo = fightService.buildFightInfoForPlayer(id)

                var battleLogs: List<BattleLog> = emptyList()
                val currentBattleId = fightInfo?.battleId

                if (currentBattleId != null) {
                        val allLogs =
                                battleLogRepository.findByBattleIdOrderByIdAsc(currentBattleId)

                        battleLogs =
                                if (battleLogId != null) {
                                        allLogs.filter { log ->
                                                log.id?.let { it > battleLogId } == true
                                        }
                                } else {
                                        val last = allLogs.lastOrNull()
                                        if (last != null) listOf(last) else emptyList()
                                }
                }

                val pictos: List<PlayerPicto> = playerPictoRepository.findByPlayerId(id)
                val luminas: List<PlayerLumina> = playerLuminaRepository.findByPlayerId(id)

                val response =
                        GetPlayerResponse(
                                id = entity.id!!,
                                playerSheet = PlayerSheetResponse.fromEntity(entity),
                                weapons = weapons,
                                fightInfo = fightInfo,
                                isMasterEditing = entity.isMasterEditing,
                                battleLogs = battleLogs,
                                pictos = pictos,
                                luminas = luminas
                        )

                return ResponseEntity.ok(response)
        }

        @PutMapping("/{id}")
        fun update(
                @PathVariable id: Int,
                @RequestBody req: UpdatePlayerRequest
        ): ResponseEntity<Void> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val p = opt.get()
                val sheet = req.playerSheet

                p.name = sheet.name
                p.characterId = sheet.characterId
                p.totalPoints = sheet.totalPoints ?: 0
                p.xp = sheet.xp ?: 0
                p.power = sheet.power ?: 0
                p.hability = sheet.hability ?: 0
                p.resistance = sheet.resistance ?: 0
                p.apCurrent = sheet.apCurrent ?: 0
                p.mpCurrent = sheet.mpCurrent ?: 0
                p.hpCurrent = sheet.hpCurrent ?: 0
                p.notes = sheet.notes
                p.weaponId = sheet.weaponId

                playerRepository.save(p)

                return ResponseEntity.ok().build()
        }

        @PutMapping("/{id}/master-editing")
        fun setMasterEditing(
                @PathVariable id: Int,
                @RequestBody body: MasterEditingRequest
        ): ResponseEntity<Void> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val player = opt.get()
                player.isMasterEditing = body.isMasterEditing
                playerRepository.save(player)

                return ResponseEntity.ok().build()
        }
}