package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_initiative")
data class BattleInitiative(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) var battleId: Int,
        @Column(name = "battle_character_id", nullable = false) var battleCharacterId: Int,
        @Column(name = "initiative_value", nullable = false) var initiativeValue: Int,
        @Column(name = "hability", nullable = false) var hability: Int,
        @Column(name = "play_first", nullable = false) var playFirst: Boolean = false
)
