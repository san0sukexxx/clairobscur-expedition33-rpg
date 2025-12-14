package com.example.demo.repository

import com.example.demo.model.PlayerSkill
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerSkillRepository : JpaRepository<PlayerSkill, Int> {
    fun findByPlayerId(playerId: Int): List<PlayerSkill>
    fun findByPlayerIdAndSkillId(playerId: Int, skillId: String): PlayerSkill?
}
