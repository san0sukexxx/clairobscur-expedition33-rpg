package com.example.demo.model

import com.fasterxml.jackson.annotation.JsonBackReference
import jakarta.persistence.*

@Entity
@Table(name = "campaign_character")
data class CampaignCharacter(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(nullable = false) val character: String,
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "campaign_id", nullable = false)
        @JsonBackReference
        var campaign: Campaign? = null
)
