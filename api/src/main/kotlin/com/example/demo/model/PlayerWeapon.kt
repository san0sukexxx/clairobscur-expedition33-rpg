package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "player_weapon")
data class PlayerWeapon(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "player_id", nullable = false) var playerId: Int,
        @Column(name = "weapon_id", nullable = false) var weaponId: String,
        @Column(name = "weapon_level", nullable = false) var weaponLevel: Int = 1
)
