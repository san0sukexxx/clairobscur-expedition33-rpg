package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "encounter_npc")
data class EncounterNpc(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "encounter_id", nullable = false) val encounterId: Int,
        @Column(name = "npc_id", nullable = false) val npcId: String,
        @Column(name = "quantity", nullable = false) val quantity: Int = 1
)
