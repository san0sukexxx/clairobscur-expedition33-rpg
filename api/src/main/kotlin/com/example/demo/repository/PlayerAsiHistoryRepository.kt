package com.example.demo.repository

import com.example.demo.model.PlayerAsiHistory
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerAsiHistoryRepository : JpaRepository<PlayerAsiHistory, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerAsiHistory>
    fun deleteByPlayerIdAndLevelGreaterThan(playerId: Int, level: Int)
}
