package com.example.demo.repository

import com.example.demo.model.BattleTurn
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleTurnRepository : JpaRepository<BattleTurn, Int> {
    fun findByBattleId(battleId: Int): List<BattleTurn>
    fun findTopByBattleIdOrderByPlayOrderDesc(battleId: Int): BattleTurn?
}
