package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "picto_effect_tracker")
data class PictoEffectTracker(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "picto_name", nullable = false) val pictoName: String,
        @Column(name = "effect_type", nullable = false) val effectType: String,
        @Column(name = "times_triggered", nullable = false) val timesTriggered: Int = 0,
        @Column(name = "last_turn_triggered") val lastTurnTriggered: Int? = null,
        @Column(name = "reset_on_turn_end", nullable = false) val resetOnTurnEnd: Boolean = false
)
