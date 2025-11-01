package com.example.demo.service

import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.FightInfoResponse
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.CampaignRepository
import org.springframework.stereotype.Service

@Service
class FightService(
        private val battleRepository: BattleRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val campaignRepository: CampaignRepository,
        private val campaignPlayerRepository: CampaignPlayerRepository
) {
    fun buildFightInfoForPlayer(playerId: Int): FightInfoResponse? {
        val campaignPlayer =
                campaignPlayerRepository.findByPlayerId(playerId)
                        ?: throw IllegalArgumentException("Player not linked to any campaign")

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
                    BattleCharacterInfo(
                            battleID = bc.battleId,
                            id = bc.externalId,
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

        return FightInfoResponse(
                initiatives = emptyList(),
                characters = characters,
                battleStatus = battle.battleStatus,
                canRollInitiative = false
        )
    }
}
