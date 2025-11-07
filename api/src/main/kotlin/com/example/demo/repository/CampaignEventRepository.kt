package com.example.demo.repository

import com.example.demo.model.CampaignEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CampaignEventRepository : JpaRepository<CampaignEvent, Int> {
    fun findByCampaignId(campaignId: Int): List<CampaignEvent>
    fun findTopByCampaignIdOrderByIdDesc(campaignId: Int): CampaignEvent?
}
