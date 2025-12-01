package com.example.demo.repository

import com.example.demo.model.PlayerPicto
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerPictoRepository : JpaRepository<PlayerPicto, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerPicto>
    fun findByPlayerIdAndPictoId(playerId: Int, pictoId: String): PlayerPicto?
}
