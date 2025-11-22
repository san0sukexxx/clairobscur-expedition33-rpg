package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "attack")
data class Attack(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "total_power", nullable = false) val totalPower: Int,
        @Column(name = "target_battle_id", nullable = false) val targetBattleId: Int,
        @Column(name = "source_battle_id", nullable = false) val sourceBattleId: Int,
        @Column(name = "total_defended", nullable = true) var totalDefended: Int? = null,
        @Column(name = "is_resolved", nullable = false) var isResolved: Boolean = false,
        @Column(name = "allow_counter", nullable = false) var allowCounter: Boolean = false,
        @Column(name = "is_counter_resolved", nullable = false) var isCounterResolved: Boolean = false
)
