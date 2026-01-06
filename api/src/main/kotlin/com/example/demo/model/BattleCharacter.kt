package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "battle_character")
data class BattleCharacter(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "battle_id", nullable = false) val battleId: Int,
        @Column(name = "external_id", nullable = false) val externalId: String,
        @Column(name = "character_name", nullable = false) val characterName: String,
        @Column(name = "character_type", nullable = false) val characterType: String,
        @Column(name = "is_enemy", nullable = false) val isEnemy: Boolean,
        @Column(name = "health_points", nullable = false) var healthPoints: Int,
        @Column(name = "max_health_points", nullable = false) var maxHealthPoints: Int,
        @Column(name = "magic_points") var magicPoints: Int? = null,
        @Column(name = "max_magic_points") val maxMagicPoints: Int? = null,
        @Column(name = "charge_points") var chargePoints: Int? = null,
        @Column(name = "max_charge_points") val maxChargePoints: Int? = null,
        @Column(name = "sun_charges") var sunCharges: Int? = null,
        @Column(name = "moon_charges") var moonCharges: Int? = null,
        @Column(name = "stance") var stance: String? = null,
        @Column(name = "stance_changed_this_turn") var stanceChangedThisTurn: Boolean = false,
        @Column(name = "stain_slot_1") var stainSlot1: String? = null,
        @Column(name = "stain_slot_2") var stainSlot2: String? = null,
        @Column(name = "stain_slot_3") var stainSlot3: String? = null,
        @Column(name = "stain_slot_4") var stainSlot4: String? = null,
        @Column(name = "perfection_rank") var perfectionRank: String? = null,
        @Column(name = "rank_progress") var rankProgress: Int? = null,
        @Column(name = "bestial_wheel_position") var bestialWheelPosition: Int? = null,
        @Column(name = "can_roll_initiative", nullable = false)
        var canRollInitiative: Boolean = false,
        @Column(name = "parries_this_turn", nullable = false)
        var parriesThisTurn: Int = 0,  // Tracks successful parries since last turn (for Payback skill)
        @Column(name = "hits_taken_this_turn", nullable = false)
        var hitsTakenThisTurn: Int = 0  // Tracks attacks that dealt damage since last turn (for Revenge skill)
)
