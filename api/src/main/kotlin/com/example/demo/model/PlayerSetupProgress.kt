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
    name = "player_setup_progress",
    uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "section"])]
)
data class PlayerSetupProgress(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
    @Column(name = "player_id", nullable = false) val playerId: Int,
    @Column(nullable = false) val section: String,
    @Column(nullable = false) var done: Boolean = false
)
