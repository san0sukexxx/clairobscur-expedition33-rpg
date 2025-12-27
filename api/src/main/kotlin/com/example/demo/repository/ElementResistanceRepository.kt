package com.example.demo.repository

import com.example.demo.model.ElementResistance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ElementResistanceRepository : JpaRepository<ElementResistance, Int> {
    fun findByBattleCharacterId(battleCharacterId: Int): List<ElementResistance>
    fun findByBattleCharacterIdAndElement(battleCharacterId: Int, element: String): ElementResistance?
    fun deleteByBattleCharacterIdAndElement(battleCharacterId: Int, element: String)
}
