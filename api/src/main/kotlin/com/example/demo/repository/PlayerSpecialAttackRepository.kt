package com.example.demo.repository

import com.example.demo.model.PlayerSpecialAttack
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerSpecialAttackRepository : JpaRepository<PlayerSpecialAttack, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerSpecialAttack>
    fun findByPlayerIdAndSpecialAttackId(playerId: Int, specialAttackId: String): PlayerSpecialAttack?
}
