package com.example.demo.model

import jakarta.persistence.*

@Entity
data class Player(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        var name: String? = null,
        var characterId: String? = null,
        var totalPoints: Int = 0,
        var xp: Int = 0,
        var apCurrent: Int = 0,
        var mpCurrent: Int = 0,
        var hpCurrent: Int = 0,
        var notes: String? = null,
        var weaponId: String? = null,
        @Column(name = "master_editing") var isMasterEditing: Boolean = false,
        @Column(name = "skills_data") var skillsData: String? = null,
        @Column(name = "hp_max") var hpMax: Int = 0,
        @Column(name = "saving_throw_proficiencies") var savingThrowProficiencies: String? = null,
        var strength: Int = 10,
        var dexterity: Int = 10,
        var constitution: Int = 10,
        var intelligence: Int = 10,
        var wisdom: Int = 10,
        var charisma: Int = 10,
        @Column(name = "lumina_bonus_points") var luminaBonusPoints: Int = 0,
        @Column(name = "bestial_wheel_reversed", nullable = false) var bestialWheelReversed: Boolean = false
)
