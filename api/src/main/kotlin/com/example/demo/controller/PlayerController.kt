package com.example.demo.controller

import com.example.demo.dto.CreatePlayerRequest
import com.example.demo.dto.CreatePlayerResponse
import com.example.demo.dto.GetPlayerResponse
import com.example.demo.dto.PlayerSheetResponse
import com.example.demo.dto.PlayerWeaponResponse
import com.example.demo.dto.UpdatePlayerRequest
import com.example.demo.model.CampaignPlayer
import com.example.demo.model.Player
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.PlayerWeaponRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/players")
class PlayerController(
        private val playerRepository: PlayerRepository,
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerWeaponRepository: PlayerWeaponRepository
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

                                val weapons =
                                        playerWeaponRepository.findByPlayerId(pid).map { pw ->
                                                PlayerWeaponResponse(
                                                        id = pw.weaponId,
                                                        level = pw.weaponLevel
                                                )
                                        }

                                GetPlayerResponse(
                                        id = pid,
                                        playerSheet = PlayerSheetResponse.fromEntity(player),
                                        weapons = weapons
                                )
                        }

                return ResponseEntity.ok(response)
        }

        @GetMapping("/{id}")
        fun getById(@PathVariable id: Int): ResponseEntity<GetPlayerResponse> {
                val playerOpt = playerRepository.findById(id)
                if (playerOpt.isEmpty) return ResponseEntity.notFound().build()

                val entity = playerOpt.get()

                val weapons =
                        playerWeaponRepository.findByPlayerId(id).map { pw ->
                                PlayerWeaponResponse(id = pw.weaponId, level = pw.weaponLevel)
                        }

                val response =
                        GetPlayerResponse(
                                id = entity.id ?: 0,
                                playerSheet = PlayerSheetResponse.fromEntity(entity),
                                weapons = weapons
                        )

                return ResponseEntity.ok(response)
        }

        @PutMapping("/{id}")
        fun update(
                @PathVariable id: Int,
                @RequestBody req: UpdatePlayerRequest
        ): ResponseEntity<GetPlayerResponse> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val p = opt.get()
                val sheet = req.playerSheet

                p.name = sheet.name
                p.characterId = sheet.characterId
                sheet.totalPoints?.let { p.totalPoints = it }
                sheet.xp?.let { p.xp = it }
                sheet.power?.let { p.power = it }
                sheet.hability?.let { p.hability = it }
                sheet.resistance?.let { p.resistance = it }
                sheet.apCurrent?.let { p.apCurrent = it }
                sheet.mpCurrent?.let { p.mpCurrent = it }
                sheet.hpCurrent?.let { p.hpCurrent = it }
                p.notes = sheet.notes
                p.weaponId = sheet.weaponId

                val saved = playerRepository.save(p)

                val weapons =
                        playerWeaponRepository.findByPlayerId(id).map { pw ->
                                PlayerWeaponResponse(id = pw.weaponId, level = pw.weaponLevel)
                        }

                val body =
                        GetPlayerResponse(
                                id = saved.id ?: 0,
                                playerSheet = PlayerSheetResponse.fromEntity(saved),
                                weapons = weapons
                        )

                return ResponseEntity.ok(body)
        }
}
