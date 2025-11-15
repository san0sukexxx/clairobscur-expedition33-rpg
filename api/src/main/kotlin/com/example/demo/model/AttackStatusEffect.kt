package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "attack_status_effect")
data class AttackStatusEffect(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "attack_id", nullable = false) val attackId: Int,
        @Column(name = "effect_type", nullable = false) val effectType: String,
        @Column(name = "ammount", nullable = false) val ammount: Int
)
