package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "campaign_event")
data class CampaignEvent(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(name = "campaign_id", nullable = false) val campaignId: Int,
        @Column(name = "event_type", nullable = false) val eventType: String,
        @Column(name = "event_value") val eventValue: String? = null
)
