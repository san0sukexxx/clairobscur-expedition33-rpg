package com.example.demo.repository

import com.example.demo.model.AttackStatusEffect
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AttackStatusEffectRepository : JpaRepository<AttackStatusEffect, Int> {
    fun findByAttackId(attackId: Int): List<AttackStatusEffect>
    fun findByAttackIdIn(attackIds: List<Int>): List<AttackStatusEffect>
}
