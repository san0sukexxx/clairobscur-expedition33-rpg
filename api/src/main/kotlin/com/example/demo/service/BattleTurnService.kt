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

    @Transactional
    fun recalculatePlayOrder(battleId: Int) {
        val turns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId)
        turns.forEachIndexed { index, turn ->
            val newOrder = index + 1
            val id = turn.id ?: return@forEachIndexed
            battleTurnRepository.updatePlayOrder(id, newOrder)
        }
    }

    @Transactional
    fun delayTurn(battleId: Int, battleCharacterId: Int, delayAmount: Int) {
        val turns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId)
        if (turns.isEmpty()) return

        // Find the turn to delay
        val targetTurnIndex = turns.indexOfFirst { it.battleCharacterId == battleCharacterId }
        if (targetTurnIndex == -1) return

        val targetTurn = turns[targetTurnIndex]
        val currentPlayOrder = targetTurn.playOrder

        // Calculate new position: current + delayAmount, but not beyond the end
        val maxPlayOrder = turns.size
        val newPlayOrder = (currentPlayOrder + delayAmount).coerceAtMost(maxPlayOrder)

        // If no change needed, return
        if (newPlayOrder == currentPlayOrder) return

        // Reorder turns: shift turns between current and new position up by 1
        turns.forEach { turn ->
            val id = turn.id ?: return@forEach
            when {
                // Target turn goes to new position
                turn.battleCharacterId == battleCharacterId -> {
                    battleTurnRepository.updatePlayOrder(id, newPlayOrder)
                }
                // Turns between current and new position shift up
                turn.playOrder in (currentPlayOrder + 1)..newPlayOrder -> {
                    battleTurnRepository.updatePlayOrder(id, turn.playOrder - 1)
                }
            }
        }
    }
}
