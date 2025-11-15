package com.example.demo.service

import com.example.demo.repository.BattleTurnRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleTurnService(private val battleTurnRepository: BattleTurnRepository) {

    @Transactional
    fun advanceTurn(battleId: Int) {
        val turns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId)
        if (turns.size <= 1) return

        val rotated = turns.drop(1) + turns.first()

        rotated.forEachIndexed { index, turn ->
            val newOrder = index + 1
            val id = turn.id ?: return@forEachIndexed
            battleTurnRepository.updatePlayOrder(id, newOrder)
        }
    }
}
