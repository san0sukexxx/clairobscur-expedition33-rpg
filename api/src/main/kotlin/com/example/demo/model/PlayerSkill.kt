package com.example.demo.model

import jakarta.persistence.*

@Entity
@Table(name = "player_skills")
data class PlayerSkill(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
        @Column(name = "player_id", nullable = false) val playerId: Int,
        @Column(name = "skill_id", nullable = false) val skillId: String
)
