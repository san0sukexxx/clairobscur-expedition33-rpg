package com.example.demo.repository

import com.example.demo.model.GameLog
import org.springframework.data.jpa.repository.JpaRepository

interface GameLogRepository : JpaRepository<GameLog, Int> {
    fun findAllByCampaignIdOrderByCreatedAtDesc(campaignId: Int): List<GameLog>
    fun findAllByCampaignIdOrderByCreatedAtAsc(campaignId: Int): List<GameLog>
}
