package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_log_entity")
data class BattleLogEntity(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_log_id", nullable = false) val battleLogId: Int,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "is_source") val isSource: Boolean = false,
        @Column(name = "is_target") val isTarget: Boolean = false
)
