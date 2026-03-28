package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "encounter_reward")
data class EncounterReward(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "encounter_id", nullable = false) val encounterId: Int,
        @Column(name = "reward_type", nullable = false) val rewardType: String,
        @Column(name = "item_id", nullable = false) val itemId: String,
        @Column(name = "level", nullable = false) val level: Int = 1
)
