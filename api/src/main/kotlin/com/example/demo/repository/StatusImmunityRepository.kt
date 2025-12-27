package com.example.demo.repository

import com.example.demo.model.StatusImmunity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface StatusImmunityRepository : JpaRepository<StatusImmunity, Int> {
    fun findByBattleCharacterId(battleCharacterId: Int): List<StatusImmunity>
    fun findByBattleCharacterIdAndStatusType(battleCharacterId: Int, statusType: String): List<StatusImmunity>
    fun deleteByBattleCharacterIdAndStatusType(battleCharacterId: Int, statusType: String)
}
