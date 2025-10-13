package com.example.demo.model

import com.fasterxml.jackson.annotation.JsonManagedReference
import jakarta.persistence.*

@Entity
@Table(name = "campaign")
data class Campaign(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(nullable = false) val name: String,
        @OneToMany(
                mappedBy = "campaign",
                cascade = [CascadeType.ALL],
                orphanRemoval = true,
                fetch = FetchType.LAZY
        )
        @JsonManagedReference
        val characters: MutableList<CampaignCharacter> = mutableListOf()
)
