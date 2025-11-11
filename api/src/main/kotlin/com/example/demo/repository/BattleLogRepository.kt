package com.example.demo.repository

import com.example.demo.model.BattleLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleLogRepository : JpaRepository<BattleLog, Int> {
    fun findByBattleId(battleId: Int): List<BattleLog>
}
