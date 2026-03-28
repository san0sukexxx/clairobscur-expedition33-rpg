package com.example.demo.repository

import com.example.demo.model.Encounter
import org.springframework.data.jpa.repository.JpaRepository

interface EncounterRepository : JpaRepository<Encounter, Int> {
    fun findByCampaignIdOrderByStoryOrderAsc(campaignId: Int): List<Encounter>
    fun countByCampaignId(campaignId: Int): Int
}
