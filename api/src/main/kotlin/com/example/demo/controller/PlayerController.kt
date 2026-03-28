package com.example.demo.controller

import com.example.demo.dto.*
import com.example.demo.model.BattleLog
import com.example.demo.model.CampaignPlayer
import com.example.demo.model.Player
import com.example.demo.model.PlayerPicto
import com.example.demo.model.PlayerLumina
import com.example.demo.model.PlayerAsiHistory
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
        private val playerItemRepository: PlayerItemRepository,
        private val playerSpecialAttackRepository: PlayerSpecialAttackRepository,
        private val playerSetupProgressRepository: PlayerSetupProgressRepository,
        private val playerAsiHistoryRepository: PlayerAsiHistoryRepository,
        private val fightService: FightService
) {

        @PostMapping
        fun create(@RequestBody req: CreatePlayerRequest): ResponseEntity<CreatePlayerResponse> {
                val player =
                        playerRepository.save(
                                Player(
                                        name = null,
                                        characterId = null,
                                        totalPoints = 1,
                                        xp = 0,
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

                // Grant starting potions (1 of each type) to new players
                val startingPotions = listOf(
                        "chroma-elixir",
                        "healing-elixir",
                        "energy-elixir",
                        "revive-elixir"
                )

                startingPotions.forEach { potionId ->
                        playerItemRepository.save(
                                com.example.demo.model.PlayerItem(
                                        playerId = playerId,
                                        itemId = potionId,
                                        quantity = 1,
                                        maxQuantity = 1
                                )
                        )
                }

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
                                        luminas = null,
                                        items = null,
                                        specialAttacks = null,
                                        setupProgress = null,
                                        asiHistory = null
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
                val items = playerItemRepository.findByPlayerId(id)
                val specialAttacks = playerSpecialAttackRepository.findByPlayerId(id)
                val setupProgress = playerSetupProgressRepository.findByPlayerId(id)
                        .map { PlayerSetupProgressDto(section = it.section, done = it.done) }
                val asiHistory = playerAsiHistoryRepository.findByPlayerId(id)

                val response =
                        GetPlayerResponse(
                                id = entity.id!!,
                                playerSheet = PlayerSheetResponse.fromEntity(entity),
                                weapons = weapons,
                                fightInfo = fightInfo,
                                isMasterEditing = entity.isMasterEditing,
                                battleLogs = battleLogs,
                                pictos = pictos,
                                luminas = luminas,
                                items = items,
                                specialAttacks = specialAttacks,
                                setupProgress = setupProgress,
                                asiHistory = asiHistory
                        )

                return ResponseEntity.ok(response)
        }

        @PutMapping("/{id}")
        @org.springframework.transaction.annotation.Transactional
        fun update(
                @PathVariable id: Int,
                @RequestBody req: UpdatePlayerRequest
        ): ResponseEntity<Void> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val p = opt.get()
                val sheet = req.playerSheet

                // Check if characterId is changing
                val oldCharacterId = p.characterId
                val newCharacterId = sheet.characterId
                val isChangingCharacter = (oldCharacterId == null && newCharacterId != null) ||
                                         (oldCharacterId != null && newCharacterId != null && oldCharacterId != newCharacterId)

                // If changing character, reset skills and unequip weapon
                if (isChangingCharacter) {
                        // Auto-set saving throw proficiencies based on character class
                        val savingThrowsByCharacter = mapOf(
                                "verso"   to listOf("strength", "constitution"),
                                "gustave" to listOf("strength", "constitution"),
                                "maelle"  to listOf("dexterity", "intelligence"),
                                "sciel"   to listOf("wisdom", "charisma"),
                                "monoco"  to listOf("intelligence", "wisdom"),
                                "lune"    to listOf("intelligence", "wisdom")
                        )
                        val profs = savingThrowsByCharacter[newCharacterId?.lowercase()]
                        if (profs != null) {
                                p.savingThrowProficiencies = profs.joinToString(",")
                        }

                        // Delete all skills (this clears the purchased/unlocked skills list)
                        val specialAttacks = playerSpecialAttackRepository.findByPlayerId(id)
                        playerSpecialAttackRepository.deleteAll(specialAttacks)

                        // Grant starting weapon for the new character
                        val startingWeaponId = getStartingWeaponForCharacter(newCharacterId)
                        if (startingWeaponId != null) {
                                // Check if player already has this weapon
                                val existingWeapon = playerWeaponRepository.findByPlayerId(id)
                                        .find { it.weaponId == startingWeaponId }

                                if (existingWeapon == null) {
                                        // Add starting weapon to player's inventory
                                        playerWeaponRepository.save(
                                                com.example.demo.model.PlayerWeapon(
                                                        playerId = id,
                                                        weaponId = startingWeaponId,
                                                        weaponLevel = 1
                                                )
                                        )
                                }

                                // Equip the starting weapon automatically
                                p.weaponId = startingWeaponId
                        } else {
                                // If no starting weapon found, unequip current weapon
                                p.weaponId = null
                        }

                        // Grant starting potions (1 of each type)
                        val startingPotions = listOf(
                                "chroma-elixir",
                                "healing-elixir",
                                "energy-elixir",
                                "revive-elixir"
                        )

                        startingPotions.forEach { potionId ->
                                val existingPotion = playerItemRepository.findByPlayerId(id)
                                        .find { it.itemId == potionId }

                                if (existingPotion == null) {
                                        // Add 1 of each potion to player's inventory
                                        playerItemRepository.save(
                                                com.example.demo.model.PlayerItem(
                                                        playerId = id,
                                                        itemId = potionId,
                                                        quantity = 1,
                                                        maxQuantity = 1
                                                )
                                        )
                                }
                        }
                }

                // Revert ASIs if level decreased
                val oldLevel = p.totalPoints
                val newLevel = sheet.totalPoints ?: 0
                var asiReverted = false
                if (newLevel < oldLevel) {
                        val toRevert = playerAsiHistoryRepository.findByPlayerId(id)
                                .filter { it.level > newLevel }
                        if (toRevert.isNotEmpty()) {
                                for (h in toRevert) {
                                        applyAttributeDelta(p, h.attribute1, -h.amount1)
                                        val attr2 = h.attribute2
                                        val amt2 = h.amount2
                                        if (attr2 != null && amt2 != null) {
                                                applyAttributeDelta(p, attr2, -amt2)
                                        }
                                }
                                playerAsiHistoryRepository.deleteByPlayerIdAndLevelGreaterThan(id, newLevel)
                                asiReverted = true
                        }
                }

                p.name = sheet.name
                p.characterId = sheet.characterId
                sheet.totalPoints?.let { p.totalPoints = it }
                sheet.xp?.let { p.xp = it }
                sheet.apCurrent?.let { p.apCurrent = it }
                sheet.mpCurrent?.let { p.mpCurrent = it }
                sheet.hpCurrent?.let { p.hpCurrent = it }
                p.notes = sheet.notes
                if (sheet.skillsData != null) p.skillsData = sheet.skillsData
                sheet.savingThrowProficiencies?.let { p.savingThrowProficiencies = it.joinToString(",") }
                // Skip abilityScores from sheet when ASI was reverted — revert already computed correct values
                if (!asiReverted) {
                        sheet.abilityScores?.let { scores ->
                                scores.strength?.let { p.strength = it }
                                scores.dexterity?.let { p.dexterity = it }
                                scores.constitution?.let { p.constitution = it }
                                scores.intelligence?.let { p.intelligence = it }
                                scores.wisdom?.let { p.wisdom = it }
                                scores.charisma?.let { p.charisma = it }
                        }
                }

                sheet.luminaBonusPoints?.let { p.luminaBonusPoints = it }

                // Only update weaponId if not changing character (already set to null above)
                if (!isChangingCharacter) {
                        p.weaponId = sheet.weaponId
                }

                // Recalculate hpMax when level changed (uses updated totalPoints and constitution)
                if (newLevel != oldLevel) {
                        val oldHpMax = p.hpMax
                        val newHpMax = calculateBaseHpMax(p)
                        val hpDelta = newHpMax - oldHpMax
                        p.hpMax = newHpMax
                        p.hpCurrent = maxOf(0, p.hpCurrent + hpDelta)
                } else if (sheet.hpMax != null) {
                        p.hpMax = sheet.hpMax
                }

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

        @PostMapping("/{id}/master-editing-off")
        fun clearMasterEditing(@PathVariable id: Int): ResponseEntity<Void> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val player = opt.get()
                player.isMasterEditing = false
                playerRepository.save(player)

                return ResponseEntity.ok().build()
        }

        @PutMapping("/{id}/setup-progress")
        fun updateSetupProgress(
                @PathVariable id: Int,
                @RequestBody body: UpdateSetupProgressRequest
        ): ResponseEntity<Void> {
                if (playerRepository.findById(id).isEmpty) return ResponseEntity.notFound().build()

                val existing = playerSetupProgressRepository.findByPlayerIdAndSection(id, body.section)
                if (existing != null) {
                        existing.done = body.done
                        playerSetupProgressRepository.save(existing)
                } else {
                        playerSetupProgressRepository.save(
                                com.example.demo.model.PlayerSetupProgress(
                                        playerId = id,
                                        section = body.section,
                                        done = body.done
                                )
                        )
                }

                return ResponseEntity.ok().build()
        }

        @PostMapping("/{id}/asi")
        fun applyAsi(
                @PathVariable id: Int,
                @RequestBody req: ApplyAsiRequest
        ): ResponseEntity<Void> {
                val opt = playerRepository.findById(id)
                if (opt.isEmpty) return ResponseEntity.notFound().build()

                val p = opt.get()
                applyAttributeDelta(p, req.attribute1, req.amount1)
                if (req.attribute2 != null && req.amount2 != null) {
                        applyAttributeDelta(p, req.attribute2, req.amount2)
                }
                playerRepository.save(p)

                playerAsiHistoryRepository.save(
                        PlayerAsiHistory(
                                playerId = id,
                                level = req.level,
                                attribute1 = req.attribute1,
                                amount1 = req.amount1,
                                attribute2 = req.attribute2,
                                amount2 = req.amount2
                        )
                )

                return ResponseEntity.ok().build()
        }

        private fun calculateBaseHpMax(p: Player): Int {
                val hitDie = when (p.characterId?.lowercase()) {
                        "verso", "gustave" -> 10
                        else -> 8
                }
                val level = p.totalPoints.coerceAtLeast(1)
                val conMod = (p.constitution - 10) / 2
                val avgPerLevel = hitDie / 2 + 1
                return hitDie + conMod + (level - 1) * (avgPerLevel + conMod)
        }

        private fun applyAttributeDelta(p: Player, attr: String, delta: Int) {
                when (attr.lowercase()) {
                        "strength"     -> p.strength     = maxOf(1, p.strength     + delta)
                        "dexterity"    -> p.dexterity    = maxOf(1, p.dexterity    + delta)
                        "constitution" -> p.constitution = maxOf(1, p.constitution + delta)
                        "intelligence" -> p.intelligence = maxOf(1, p.intelligence + delta)
                        "wisdom"       -> p.wisdom       = maxOf(1, p.wisdom       + delta)
                        "charisma"     -> p.charisma     = maxOf(1, p.charisma     + delta)
                }
        }

        private fun getStartingWeaponForCharacter(characterId: String?): String? {
                return when (characterId) {
                        "gustave" -> "Noahram"
                        "lune" -> "Lunerim"
                        "maelle" -> "Maellum"
                        "sciel" -> "Scieleson"
                        "verso" -> "Verleso"
                        "monoco" -> "Monocaro"
                        else -> null
                }
        }
}
