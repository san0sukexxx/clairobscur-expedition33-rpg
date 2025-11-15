package com.example.demo.repository

import com.example.demo.model.Attack
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AttackRepository : JpaRepository<Attack, Int> {
    fun findByBattleId(battleId: Int): List<Attack>
    fun findByBattleIdAndIsResolvedFalse(battleId: Int): List<Attack>
}
