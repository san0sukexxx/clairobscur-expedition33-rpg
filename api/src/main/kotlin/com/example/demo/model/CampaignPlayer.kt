package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "campaign_player")
data class CampaignPlayer(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "player_id", nullable = false) val playerId: Int
)
