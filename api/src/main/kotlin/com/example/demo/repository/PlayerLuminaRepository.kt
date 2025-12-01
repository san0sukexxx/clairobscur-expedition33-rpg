package com.example.demo.repository

import com.example.demo.model.PlayerLumina
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerLuminaRepository : JpaRepository<PlayerLumina, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerLumina>
    fun findByPlayerIdAndPictoId(playerId: Int, pictoId: String): PlayerLumina?
}
