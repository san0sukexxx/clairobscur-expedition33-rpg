package com.example.demo.repository

import com.example.demo.model.PictoEffectTracker
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PictoEffectTrackerRepository : JpaRepository<PictoEffectTracker, Int> {
    fun findByBattleIdAndBattleCharacterIdAndPictoName(
            battleId: Int,
            battleCharacterId: Int,
            pictoName: String
    ): PictoEffectTracker?

    fun findByBattleId(battleId: Int): List<PictoEffectTracker>

    fun findByBattleCharacterId(battleCharacterId: Int): List<PictoEffectTracker>

    fun deleteByBattleId(battleId: Int)
}
