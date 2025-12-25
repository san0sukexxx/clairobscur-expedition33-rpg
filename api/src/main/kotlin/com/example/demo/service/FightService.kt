package com.example.demo.service

import com.example.demo.dto.AttackResponse
import com.example.demo.dto.AttackStatusEffectResponse
import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.BattleStatusResponse
import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.FightInfoResponse
import com.example.demo.dto.InitiativeResponse
import com.example.demo.repository.AttackRepository
import com.example.demo.repository.AttackStatusEffectRepository
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
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
        private val initiativeRepository: InitiativeRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val attackRepository: AttackRepository,
        private val attackStatusEffectRepository: AttackStatusEffectRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository
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

                                val status =
                                        battleStatusEffectRepository.findByBattleCharacterId(
                                                        bc.id!!
                                                )
                                                .map {
                                                        BattleStatusResponse(
                                                                effectName = it.effectType,
                                                                ammount = it.ammount,
                                                                remainingTurns = it.remainingTurns,
                                                                isResolved = it.isResolved
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

                val playerBattleEntity =
                        characterEntities.firstOrNull {
                                it.externalId.toIntOrNull() == playerId &&
                                        it.characterType == "player"
                        }

                val playerBattleID = playerBattleEntity?.id

                val initiatives =
                        initiativeRepository.findByBattleId(battleId).map { i ->
                                InitiativeResponse(
                                        playFirst = i.playFirst,
                                        battleID = i.battleCharacterId,
                                        value = i.initiativeValue,
                                        hability = i.hability
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

                val canRollInitiative = playerBattleEntity?.canRollInitiative ?: false

                val pendingAttacks =
                        if (playerBattleID != null) {
                                attackRepository.findPendingOrCounter(battleId, playerBattleID)
                                        .map { a ->
                                                val effects =
                                                        attackStatusEffectRepository.findByAttackId(
                                                                        a.id!!
                                                                )
                                                                .map { e ->
                                                                        AttackStatusEffectResponse(
                                                                                id = e.id!!,
                                                                                effectType =
                                                                                        e.effectType,
                                                                                ammount = e.ammount,
                                                                                remainingTurns = e.remainingTurns
                                                                        )
                                                                }

                                                AttackResponse(
                                                        id = a.id!!,
                                                        battleId = a.battleId,
                                                        totalPower = a.totalPower,
                                                        targetBattleId = a.targetBattleId,
                                                        sourceBattleId = a.sourceBattleId,
                                                        totalDefended = a.totalDefended,
                                                        allowCounter = a.allowCounter,
                                                        isResolved = a.isResolved,
                                                        isCounterResolved = a.isCounterResolved,
                                                        effects = effects
                                                )
                                        }
                        } else {
                                emptyList()
                        }

                return FightInfoResponse(
                        battleId = battleId,
                        playerBattleID = playerBattleID,
                        initiatives = initiatives,
                        characters = characters,
                        battleStatus = battle.battleStatus,
                        canRollInitiative = canRollInitiative,
                        turns = turns,
                        pendingAttacks = pendingAttacks
                )
        }
}
