package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_turn")
data class BattleTurn(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "play_order", nullable = false) var playOrder: Int
)
