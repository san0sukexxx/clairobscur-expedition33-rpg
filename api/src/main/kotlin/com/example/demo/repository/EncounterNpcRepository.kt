package com.example.demo.repository

import com.example.demo.model.EncounterNpc
import org.springframework.data.jpa.repository.JpaRepository

interface EncounterNpcRepository : JpaRepository<EncounterNpc, Int> {
    fun findByEncounterId(encounterId: Int): List<EncounterNpc>
    fun deleteByEncounterId(encounterId: Int)
}
