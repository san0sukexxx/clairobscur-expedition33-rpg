package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_log")
data class BattleLog(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "event_type", nullable = false) val eventType: String,
        @Column(name = "event_json") val eventJson: String? = null
)
