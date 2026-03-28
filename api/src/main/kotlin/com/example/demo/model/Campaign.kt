package com.example.demo.model

import com.fasterxml.jackson.annotation.JsonManagedReference
import jakarta.persistence.*

@Entity
@Table(name = "campaign")
data class Campaign(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(nullable = false) var name: String,
        @Column(name = "current_location_id") var currentLocationId: String? = null,
        @OneToMany(
                mappedBy = "campaign",
                cascade = [CascadeType.ALL],
                orphanRemoval = true,
                fetch = FetchType.LAZY
        )
        @JsonManagedReference
        val characters: MutableList<CampaignCharacter> = mutableListOf()
)
