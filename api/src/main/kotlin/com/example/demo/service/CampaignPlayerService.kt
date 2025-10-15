package com.example.demo.service

import com.example.demo.dto.GetPlayerResponse
import com.example.demo.dto.PlayerSheetResponse
import com.example.demo.mapper.toResponse
import com.example.demo.repository.CampaignPlayerRepository
import com.example.demo.repository.PlayerRepository
import com.example.demo.repository.PlayerWeaponRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CampaignPlayerService(
        private val campaignPlayerRepository: CampaignPlayerRepository,
        private val playerRepository: PlayerRepository,
        private val playerWeaponRepository: PlayerWeaponRepository
) {

    fun listPlayersByCampaign(campaignId: Int): List<GetPlayerResponse> {
        val links = campaignPlayerRepository.findAllByCampaignId(campaignId)
        val playerIds = links.mapNotNull { it.playerId }

        val players = playerRepository.findAllById(playerIds)

        return players.map { p ->
            val pid = p.id ?: 0

            val weapons = playerWeaponRepository.findByPlayerId(pid).map { it.toResponse() }

            GetPlayerResponse(
                    id = pid,
                    playerSheet = PlayerSheetResponse.fromEntity(p),
                    weapons = weapons
            )
        }
    }

    @Transactional
    fun deletePlayerFromCampaign(campaignId: Int, playerId: Int) {
        campaignPlayerRepository.deleteLink(campaignId, playerId)
        playerRepository.deleteById(playerId)
    }
}
