package com.example.demo.repository

import com.example.demo.model.CampaignPlayer
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface CampaignPlayerRepository : JpaRepository<CampaignPlayer, Int> {
    fun findAllByCampaignId(campaignId: Int): List<CampaignPlayer>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(
            "DELETE FROM CampaignPlayer cp WHERE cp.campaignId = :campaignId AND cp.playerId = :playerId"
    )
    fun deleteLink(@Param("campaignId") campaignId: Int, @Param("playerId") playerId: Int): Int

    fun findByPlayerId(playerId: Int): CampaignPlayer?
}
