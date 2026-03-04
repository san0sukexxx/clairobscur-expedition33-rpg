package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "encounter")
data class Encounter(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "location_id", nullable = true) var locationId: String? = null
)
