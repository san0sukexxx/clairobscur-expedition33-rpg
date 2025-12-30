package com.example.demo.repository

import com.example.demo.model.BattleTurnDamageTracker
import org.springframework.data.jpa.repository.JpaRepository

interface BattleTurnDamageTrackerRepository : JpaRepository<BattleTurnDamageTracker, Int> {
    fun findByBattleIdAndBattleCharacterIdAndTurnNumber(
            battleId: Int,
            battleCharacterId: Int,
            turnNumber: Int
    ): BattleTurnDamageTracker?

    fun deleteByBattleId(battleId: Int)
}
