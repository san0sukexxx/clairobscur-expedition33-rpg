package com.example.demo.repository

import com.example.demo.model.BattleInitiative
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleInitiativeRepository : JpaRepository<BattleInitiative, Int> {
    fun findByBattleCharacterId(battleCharacterId: Int): BattleInitiative?
    fun existsByBattleCharacterId(battleCharacterId: Int): Boolean
    fun deleteByBattleCharacterId(battleCharacterId: Int)
    fun findByBattleId(battleId: Int): List<BattleInitiative>
}
