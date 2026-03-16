package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "game_log")
data class GameLog(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
    @Column(name = "campaign_id", nullable = false) val campaignId: Int,
    @Column(name = "player_id") val playerId: Int? = null,
    @Column(name = "roll_type", nullable = false) val rollType: String,
    @Column(name = "ability_key") val abilityKey: String? = null,
    @Column(name = "skill_id") val skillId: String? = null,
    @Column(name = "sense_key") val senseKey: String? = null,
    @Column(name = "dice_rolled", nullable = false) val diceRolled: Int,
    @Column(name = "modifier", nullable = false) val modifier: Int,
    @Column(name = "total", nullable = false) val total: Int,
    @Column(name = "dice_command", nullable = false) val diceCommand: String,
    @Column(name = "created_at", nullable = false) val createdAt: String
)
