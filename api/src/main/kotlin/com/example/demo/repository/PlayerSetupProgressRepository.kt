package com.example.demo.repository

import com.example.demo.model.PlayerSetupProgress
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerSetupProgressRepository : JpaRepository<PlayerSetupProgress, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerSetupProgress>
    fun findByPlayerIdAndSection(playerId: Int, section: String): PlayerSetupProgress?
}
