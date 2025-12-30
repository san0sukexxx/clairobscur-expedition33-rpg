package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_turn_damage_tracker")
data class BattleTurnDamageTracker(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "turn_number", nullable = false) val turnNumber: Int,
        @Column(name = "damage_taken", nullable = false) var damageTaken: Int
)
