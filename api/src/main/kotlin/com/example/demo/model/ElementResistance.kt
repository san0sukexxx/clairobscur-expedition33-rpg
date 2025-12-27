package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "element_resistance")
data class ElementResistance(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
        @Column(name = "element", nullable = false) val element: String,
        @Column(name = "resistance_type", nullable = false) val resistanceType: String, // 'immune', 'resist', 'weak'
        @Column(name = "damage_multiplier", nullable = false) val damageMultiplier: Double // 0.5 for resist, 1.5 for weak, 0.0 for immune
)
