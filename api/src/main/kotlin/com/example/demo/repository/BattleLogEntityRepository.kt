package com.example.demo.repository

import com.example.demo.model.BattleLogEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleLogEntityRepository : JpaRepository<BattleLogEntity, Int> {
    fun findByBattleLogId(battleLogId: Int): List<BattleLogEntity>
    fun findByBattleCharacterId(battleCharacterId: Int): List<BattleLogEntity>
}
