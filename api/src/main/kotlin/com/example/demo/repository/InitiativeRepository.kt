package com.example.demo.repository

import com.example.demo.model.BattleInitiative
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InitiativeRepository : JpaRepository<BattleInitiative, Int> {
    fun findByBattleId(battleId: Int): List<BattleInitiative>
    fun findByBattleCharacterId(battleCharacterId: Int): BattleInitiative?
}
