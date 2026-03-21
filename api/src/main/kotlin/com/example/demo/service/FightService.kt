package com.example.demo.service

import com.example.demo.dto.BattleCharacterInfo
import com.example.demo.dto.BattleStatusResponse
import com.example.demo.dto.BattleTurnResponse
import com.example.demo.dto.FightInfoResponse
import com.example.demo.dto.InitiativeResponse
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleRepository
import com.example.demo.repository.BattleStatusEffectRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.InitiativeRepository
import com.example.demo.repository.PlayerRepository
import org.springframework.stereotype.Service

@Service
class FightService(
        private val battleRepository: BattleRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerRepository: PlayerRepository,
        private val initiativeRepository: InitiativeRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleStatusEffectRepository: BattleStatusEffectRepository
) {
        fun buildFightInfoForPlayer(playerId: Int): FightInfoResponse? {
                campaignPlayerRepository.findByPlayerId(playerId)
                        ?: throw IllegalArgumentException("Player not linked to any campaign")

                val playerBattleChar = battleCharacterRepository
                        .findByExternalIdAndCharacterType(playerId.toString(), "player")
                        .firstOrNull() ?: return null

                val battleId = playerBattleChar.battleId ?: return null
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
                                        stainSlot1 = bc.stainSlot1,
                                        stainSlot2 = bc.stainSlot2,
                                        stainSlot3 = bc.stainSlot3,
                                        stainSlot4 = bc.stainSlot4,
                                        perfectionRank = bc.perfectionRank,
                                        rankProgress = bc.rankProgress,
                                        bestialWheelPosition = bc.bestialWheelPosition,
                                        status = status,
                                        type = bc.characterType,
                                        isEnemy = bc.isEnemy,
                                        canRollInitiative = bc.canRollInitiative,
                                        parriesThisTurn = bc.parriesThisTurn,
                                        hitsTakenThisTurn = bc.hitsTakenThisTurn,
                                        foretellConsumedTotal = bc.foretellConsumedTotal,
                                        freeShotWeakPoints = bc.freeShotWeakPoints,
                                        breakCount = bc.breakCount,
                                        nameHidden = bc.nameHidden
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

                return FightInfoResponse(
                        battleId = battleId,
                        playerBattleID = playerBattleID,
                        initiatives = initiatives,
                        characters = characters,
                        battleStatus = battle.battleStatus,
                        canRollInitiative = canRollInitiative,
                        turns = turns
                )
        }
}
