package com.example.demo.repository

import com.example.demo.model.Attack
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface AttackRepository : JpaRepository<Attack, Int> {
    fun findByBattleId(battleId: Int): List<Attack>
    fun findByTargetBattleId(targetBattleId: Int): List<Attack>
    fun findByBattleIdAndIsResolvedFalse(battleId: Int): List<Attack>

    fun findByBattleIdAndTargetBattleIdAndIsResolvedFalse(
            battleId: Int,
            targetBattleId: Int
    ): List<Attack>

    @Query(
            """
        SELECT a FROM Attack a
        WHERE a.battleId = :battleId
          AND a.targetBattleId = :targetBattleId
          AND (
                a.isResolved = false
             OR (a.allowCounter = true AND a.isCounterResolved = false)
          )
        """
    )
    fun findPendingOrCounter(
            @Param("battleId") battleId: Int,
            @Param("targetBattleId") targetBattleId: Int
    ): List<Attack>
}
