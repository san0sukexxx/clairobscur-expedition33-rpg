package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "encounter")
data class Encounter(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "location_id", nullable = true) var locationId: String? = null,
        @Column(name = "name", nullable = true) var name: String? = null,
        @Column(name = "story_order", nullable = false) var storyOrder: Int = 0,
        @Column(name = "bonus_xp", nullable = false) var bonusXp: Int = 0,
        @Column(name = "player_character_ids", nullable = true) var playerCharacterIds: String? = null
)
