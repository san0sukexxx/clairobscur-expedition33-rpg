package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "player_asi_history")
data class PlayerAsiHistory(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "player_id") val playerId: Int,
        @Column(name = "level") val level: Int,
        @Column(name = "attribute1") val attribute1: String,
        @Column(name = "amount1") val amount1: Int,
        @Column(name = "attribute2") val attribute2: String? = null,
        @Column(name = "amount2") val amount2: Int? = null
)
