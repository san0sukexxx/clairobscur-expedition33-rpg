package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_status_effect")
data class BattleStatusEffect(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_character_id", nullable = false) var battleCharacterId: Int,
        @Column(name = "effect_type", nullable = false) var effectType: String,
        @Column(name = "ammount", nullable = false) var ammount: Int
)
