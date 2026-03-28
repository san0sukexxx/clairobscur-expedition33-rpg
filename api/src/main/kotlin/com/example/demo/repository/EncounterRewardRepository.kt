package com.example.demo.repository

import com.example.demo.model.EncounterReward
import org.springframework.data.jpa.repository.JpaRepository

interface EncounterRewardRepository : JpaRepository<EncounterReward, Int> {
    fun findByEncounterId(encounterId: Int): List<EncounterReward>
    fun deleteByEncounterId(encounterId: Int)
}
