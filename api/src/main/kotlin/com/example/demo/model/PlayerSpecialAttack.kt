package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "player_special_attacks")
data class PlayerSpecialAttack(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "player_id", nullable = false) val playerId: Int,
        @Column(name = "special_attack_id", nullable = false) val specialAttackId: String,
        @Column(name = "slot") val slot: Int? = null
)
