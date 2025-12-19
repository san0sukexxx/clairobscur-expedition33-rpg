package com.example.demo.service

import com.example.demo.dto.GetPlayerResponse
import com.example.demo.dto.PlayerSheetResponse
import com.example.demo.dto.PlayerWeaponResponse
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.PlayerWeaponRepository
import com.example.demo.repository.PlayerPictoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CampaignPlayerService(
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerRepository: PlayerRepository,
        private val playerWeaponRepository: PlayerWeaponRepository,
        private val playerPictoRepository: PlayerPictoRepository
) {

        fun listPlayersByCampaign(campaignId: Int): List<GetPlayerResponse> {
                val links = campaignPlayerRepository.findAllByCampaignId(campaignId)
                val playerIds = links.mapNotNull { it.playerId }

                val players = playerRepository.findAllById(playerIds)

                return players.map { p ->
                        val pid = p.id ?: 0

                        val weapons =
                                playerWeaponRepository.findByPlayerId(pid).map { pw ->
                                        PlayerWeaponResponse(
                                                id = pw.weaponId,
                                                level = pw.weaponLevel
                                        )
                                }

                        val pictos = playerPictoRepository.findByPlayerId(pid)

                        GetPlayerResponse(
                                id = pid,
                                playerSheet = PlayerSheetResponse.fromEntity(p),
                                weapons = weapons,
                                fightInfo = null,
                                isMasterEditing = null,
                                battleLogs = null,
                                pictos = pictos,
                                luminas = null,
                                items = null,
                                skills = null
                        )
                }
        }

        @Transactional
        fun deletePlayerFromCampaign(campaignId: Int, playerId: Int) {
                campaignPlayerRepository.deleteLink(campaignId, playerId)
                playerRepository.deleteById(playerId)
        }
}
