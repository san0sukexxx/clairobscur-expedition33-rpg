package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(
        name = "player_luminas",
        uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "picto_id"])]
)
data class PlayerLumina(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(name = "player_id", nullable = false) val playerId: Int,
        @Column(name = "picto_id", nullable = false) val pictoId: String,
        @Column(name = "is_equiped", nullable = false) val isEquiped: Boolean = false
)
