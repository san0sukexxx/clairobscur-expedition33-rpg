package com.example.demo.repository

import com.example.demo.model.PlayerWeapon
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlayerWeaponRepository : JpaRepository<PlayerWeapon, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerWeapon>
    fun findByPlayerIdAndWeaponId(playerId: Int, weaponId: String): PlayerWeapon?
}
