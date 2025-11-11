package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_log")
data class BattleLog(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "event_type", nullable = false) val eventType: String,
        @Column(name = "event_description") val eventDescription: String? = null,
        @Column(name = "event_value") val eventValue: String? = null
)
