package com.example.demo.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
        name = "player_luminas",
        uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "picto_id"])]
)
data class PlayerLumina(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(name = "player_id", nullable = false) val playerId: Int,
        @Column(name = "picto_id", nullable = false) val pictoId: String
)
