package com.example.demo.repository

import com.example.demo.model.BattleStatusEffect
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BattleStatusEffectRepository : JpaRepository<BattleStatusEffect, Int> {
    fun findByBattleCharacterId(battleCharacterId: Int): List<BattleStatusEffect>
}
