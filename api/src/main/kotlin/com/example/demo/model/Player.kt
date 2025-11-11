package com.example.demo.model

import jakarta.persistence.*

@Entity
data class Player(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        var name: String? = null,
        var characterId: String? = null,
        var totalPoints: Int = 0,
        var xp: Int = 0,
        var power: Int = 0,
        var hability: Int = 0,
        var resistance: Int = 0,
        var apCurrent: Int = 0,
        var mpCurrent: Int = 0,
        var hpCurrent: Int = 0,
        var notes: String? = null,
        var weaponId: String? = null,
        @Column(name = "master_editing") var isMasterEditing: Boolean = false
)
