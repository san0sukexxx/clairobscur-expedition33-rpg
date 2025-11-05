package com.example.demo.service

import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.FightInfoResponse
import com.example.demo.dto.InitiativeResponse
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.CampaignRepository
import com.example.demo.repository.InitiativeRepository
import com.example.demo.repository.PlayerRepository
import org.springframework.stereotype.Service

@Service
class FightService(
        private val battleRepository: BattleRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val campaignRepository: CampaignRepository,
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerRepository: PlayerRepository,
        private val initiativeRepository: InitiativeRepository
) {
        fun buildFightInfoForPlayer(playerId: Int): FightInfoResponse? {
                val campaignPlayer =
                        campaignPlayerRepository.findByPlayerId(playerId)
                                ?: throw IllegalArgumentException(
                                        "Player not linked to any campaign"
                                )

                val campaignId = campaignPlayer.campaignId
                val campaign =
                        campaignRepository.findById(campaignId).orElseThrow {
                                IllegalArgumentException("Campaign not found with id: $campaignId")
                        }

                val battleId = campaign.battleId ?: return null
                val battle = battleRepository.findById(battleId).orElse(null) ?: return null

                val characterEntities = battleCharacterRepository.findByBattleId(battleId)

                val characters: List<BattleCharacterInfo> =
                        characterEntities.map { bc ->
                                val playerIdFromExternal = bc.externalId.toIntOrNull()
                                val externalId =
                                        if (bc.characterType == "player") {
                                                playerIdFromExternal?.let { pid ->
                                                        playerRepository
                                                                .findById(pid)
                                                                .orElse(null)
                                                                ?.characterId
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
                                        isEnemy = bc.isEnemy
                                )
                        }

                val playerBattleID =
                        characterEntities
                                .firstOrNull { it.externalId.toIntOrNull() == playerId }
                                ?.id

                val initiatives =
                        initiativeRepository.findByBattleId(battleId).map { i ->
                                InitiativeResponse(
                                        playFirst = i.playFirst,
                                        battleID = i.battleCharacterId,
                                        value = i.initiativeValue,
                                        hability = i.hability
                                )
                        }

                val playerHasInitiative =
                        playerBattleID != null && initiatives.any { it.battleID == playerBattleID }
                val canRollInitiative = playerBattleID != null && !playerHasInitiative

                return FightInfoResponse(
                        playerBattleID = playerBattleID,
                        initiatives = initiatives,
                        characters = characters,
                        battleStatus = battle.battleStatus,
                        canRollInitiative = canRollInitiative
                )
        }
}
