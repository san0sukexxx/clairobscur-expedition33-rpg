package com.example.demo.service

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.model.BattleCharacter
import com.example.demo.model.BattleInitiative
import com.example.demo.model.BattleLog
import com.example.demo.model.BattleTurn
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleInitiativeRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleTurnRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleCharacterService(
        private val repository: BattleCharacterRepository,
        private val initiativeRepository: BattleInitiativeRepository,
        private val battleLogRepository: BattleLogRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleTurnService: BattleTurnService,
        private val battleRepository: BattleRepository,
        private val objectMapper: ObjectMapper
) {
        @Transactional
        fun addCharacter(battleId: Int, request: AddBattleCharacterRequest): Int {
                val battle =
                        battleRepository.findById(battleId).orElseThrow {
                                IllegalArgumentException("Battle $battleId not found")
                        }

                val isBattleStarted = battle.battleStatus.equals("started", ignoreCase = true)
                val isEnemy = request.team.equals("B", ignoreCase = true)

                val entity =
                        BattleCharacter(
                                battleId = battleId,
                                externalId = request.externalId,
                                characterName = request.characterName,
                                characterType = request.characterType,
                                isEnemy = isEnemy,
                                healthPoints = request.healthPoints,
                                maxHealthPoints = request.maxHealthPoints,
                                magicPoints = request.magicPoints,
                                maxMagicPoints = request.maxMagicPoints,
                                canRollInitiative = request.canRollInitiative
                        )

                val savedCharacter = repository.save(entity)

                request.initiative?.let { initiativeRequest ->
                        when {
                                !isBattleStarted -> {
                                        val initiative =
                                                BattleInitiative(
                                                        battleId = battleId,
                                                        battleCharacterId = savedCharacter.id!!,
                                                        initiativeValue =
                                                                initiativeRequest.initiativeValue,
                                                        hability = initiativeRequest.hability,
                                                        playFirst = initiativeRequest.playFirst
                                                )

                                        initiativeRepository.save(initiative)
                                }
                                isBattleStarted &&
                                        request.characterType.equals("npc", ignoreCase = true) -> {
                                        val lastTurn =
                                                battleTurnRepository
                                                        .findTopByBattleIdOrderByPlayOrderDesc(
                                                                battleId
                                                        )
                                        val nextOrder = (lastTurn?.playOrder ?: -1) + 1
                                        val turn =
                                                BattleTurn(
                                                        battleId = battleId,
                                                        battleCharacterId = savedCharacter.id!!,
                                                        playOrder = nextOrder
                                                )
                                        battleTurnRepository.save(turn)
                                }
                                else -> {}
                        }
                }

                val eventJson =
                        objectMapper.writeValueAsString(
                                mapOf(
                                        "battleCharacterId" to savedCharacter.id,
                                        "characterName" to savedCharacter.characterName,
                                        "characterType" to savedCharacter.characterType,
                                        "externalId" to savedCharacter.externalId,
                                        "isEnemy" to savedCharacter.isEnemy,
                                        "canRollInitiative" to savedCharacter.canRollInitiative
                                )
                        )

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "ADD_CHARACTER",
                                eventJson = eventJson
                        )
                )

                return savedCharacter.id!!
        }

        @Transactional
        fun removeCharacter(id: Int) {
                val opt = repository.findById(id)
                if (opt.isEmpty) return

                val character = opt.get()

                val battleId =
                        character.battleId ?: error("BattleCharacter $id não possui battleId")

                battleTurnRepository.deleteByBattleCharacterId(id)

                repository.deleteById(id)

                battleTurnService.recalculatePlayOrder(battleId)

                battleLogRepository.save(
                        BattleLog(
                                battleId = battleId,
                                eventType = "REMOVE_CHARACTER",
                                eventJson = null
                        )
                )
        }

        fun listCharacters(battleId: Int): List<BattleCharacter> {
                return repository.findByBattleId(battleId)
        }
}
