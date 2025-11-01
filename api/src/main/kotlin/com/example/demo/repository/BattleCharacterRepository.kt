package com.example.demo.repository

import com.example.demo.model.BattleCharacter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleCharacterRepository : JpaRepository<BattleCharacter, Int> {
    fun findByBattleIdAndIsEnemy(battleId: Int, isEnemy: Boolean): List<BattleCharacter>
    fun findByBattleId(battleId: Int): List<BattleCharacter>
    
}
