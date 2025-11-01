package com.example.demo.repository

import com.example.demo.model.Battle
import org.springframework.data.jpa.repository.JpaRepository

interface BattleRepository : JpaRepository<Battle, Int> {
    fun findByCampaignId(campaignId: Int): List<Battle>
}
