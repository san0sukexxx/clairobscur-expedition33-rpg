package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_status_effect")
data class BattleStatusEffect(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "effect_type", nullable = false) val effectType: String,
        @Column(name = "ammount", nullable = false) var ammount: Int,
        @Column(name = "remaining_turns") val remainingTurns: Int? = null,
        @Column(name = "is_resolved", nullable = false) val isResolved: Boolean = false,
        @Column(name = "skip_next_decrement", nullable = false) val skipNextDecrement: Boolean = false
)
