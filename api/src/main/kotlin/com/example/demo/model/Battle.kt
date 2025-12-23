package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle")
data class Battle(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "battle_status", nullable = false) var battleStatus: String,
        @Column(name = "team_a_gradient_points", nullable = false) var teamAGradientPoints: Int = 0,
        @Column(name = "team_b_gradient_points", nullable = false) var teamBGradientPoints: Int = 0
)
