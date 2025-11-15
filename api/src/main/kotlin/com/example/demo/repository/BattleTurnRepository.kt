package com.example.demo.repository

import com.example.demo.model.BattleTurn
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface BattleTurnRepository : JpaRepository<BattleTurn, Int> {
    fun findByBattleId(battleId: Int): List<BattleTurn>
    fun findTopByBattleIdOrderByPlayOrderDesc(battleId: Int): BattleTurn?
    fun findByBattleIdOrderByPlayOrderAsc(battleId: Int): List<BattleTurn>
    fun findByBattleCharacterId(battleCharacterId: Int): List<BattleTurn>

    @Modifying
    @Query("UPDATE BattleTurn bt SET bt.playOrder = :playOrder WHERE bt.id = :id")
    fun updatePlayOrder(id: Int, playOrder: Int)
}
