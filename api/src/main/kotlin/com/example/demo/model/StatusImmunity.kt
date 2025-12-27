package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "status_immunity")
data class StatusImmunity(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "status_type", nullable = false) val statusType: String,
        @Column(name = "immunity_type", nullable = false) val immunityType: String, // 'immune', 'resist'
        @Column(name = "resist_chance") val resistChance: Int? = null // For 'resist' type, chance to avoid (e.g., 50%)
)
