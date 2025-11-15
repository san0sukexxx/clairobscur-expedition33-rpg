package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_character")
data class BattleCharacter(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "external_id", nullable = false) val externalId: String,
        @Column(name = "character_name", nullable = false) val characterName: String,
        @Column(name = "character_type", nullable = false) val characterType: String,
        @Column(name = "is_enemy", nullable = false) val isEnemy: Boolean,
        @Column(name = "health_points", nullable = false) var healthPoints: Int,
        @Column(name = "max_health_points", nullable = false) val maxHealthPoints: Int,
        @Column(name = "magic_points") val magicPoints: Int? = null,
        @Column(name = "max_magic_points") val maxMagicPoints: Int? = null,
        @Column(name = "can_roll_initiative", nullable = false)
        var canRollInitiative: Boolean = false
)
