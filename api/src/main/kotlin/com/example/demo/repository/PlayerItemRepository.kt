package com.example.demo.repository

import com.example.demo.model.PlayerItem
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerItemRepository : JpaRepository<PlayerItem, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerItem>
    fun findByPlayerIdAndItemId(playerId: Int, itemId: String): PlayerItem?
}
