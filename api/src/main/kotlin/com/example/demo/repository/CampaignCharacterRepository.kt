package com.example.demo.repository

import com.example.demo.model.CampaignCharacter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CampaignCharacterRepository : JpaRepository<CampaignCharacter, Int> {
    fun findAllByCampaignId(campaignId: Int): List<CampaignCharacter>
}
