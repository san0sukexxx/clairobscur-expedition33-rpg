package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle")
data class Battle(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "battle_status", nullable = false) var battleStatus: String
)
