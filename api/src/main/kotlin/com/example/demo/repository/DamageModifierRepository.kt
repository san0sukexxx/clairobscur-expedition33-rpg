package com.example.demo.repository

import com.example.demo.model.DamageModifier
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DamageModifierRepository : JpaRepository<DamageModifier, Int> {
    fun findByBattleCharacterId(battleCharacterId: Int): List<DamageModifier>
    fun findByBattleCharacterIdAndIsActive(battleCharacterId: Int, isActive: Boolean): List<DamageModifier>
}
