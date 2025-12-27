package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "damage_modifier")
data class DamageModifier(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
    @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
    @Column(name = "modifier_type", nullable = false) val modifierType: String,
    @Column(name = "multiplier", nullable = false) val multiplier: Double,
    @Column(name = "flat_bonus", nullable = false) val flatBonus: Int = 0,
    @Column(name = "condition_type") val conditionType: String? = null,
    @Column(name = "is_active", nullable = false) var isActive: Boolean = true
)
