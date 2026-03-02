package com.example.demo.repository

import com.example.demo.model.Encounter
import org.springframework.data.jpa.repository.JpaRepository

interface EncounterRepository : JpaRepository<Encounter, Int> {
    fun findByCampaignId(campaignId: Int): List<Encounter>
}
