package com.example.demo.service

import com.example.demo.model.PictoEffectTracker
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleLogRepository
import com.example.demo.repository.BattleTurnRepository
import com.example.demo.repository.PictoEffectTrackerRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PictoEffectTrackerService(
        private val pictoEffectTrackerRepository: PictoEffectTrackerRepository,
        private val battleTurnRepository: BattleTurnRepository,
        private val battleCharacterRepository: BattleCharacterRepository,
        private val battleLogRepository: BattleLogRepository
) {

    /**
     * Verifica se um efeito pode ser ativado
     * @return true se pode ativar, false caso contrário
     */
    @Transactional
    fun canActivate(
            battleId: Int,
            battleCharacterId: Int,
            pictoName: String,
            effectType: String
    ): Boolean {
        val tracker = pictoEffectTrackerRepository.findByBattleIdAndBattleCharacterIdAndPictoName(
                battleId,
                battleCharacterId,
                pictoName
        )

        // Se não existe tracker, pode ativar
        if (tracker == null) {
            return true
        }

        // Obter turno atual
        val currentTurnNumber = getCurrentTurnNumber(battleId)

        return when (effectType) {
            "once-per-battle" -> {
                // Se já foi ativado alguma vez na batalha, não pode ativar
                tracker.timesTriggered == 0
            }
            "once-per-turn" -> {
                // Se o último turno ativado é diferente do turno atual, pode ativar
                tracker.lastTurnTriggered == null || tracker.lastTurnTriggered != currentTurnNumber
            }
            "counter" -> {
                // Counters sempre podem ser incrementados
                true
            }
            else -> true
        }
    }

    /**
     * Registra a ativação de um efeito
     */
    @Transactional
    fun track(
            battleId: Int,
            battleCharacterId: Int,
            pictoName: String,
            effectType: String
    ): PictoEffectTracker {
        val currentTurnNumber = getCurrentTurnNumber(battleId)

        val existingTracker = pictoEffectTrackerRepository.findByBattleIdAndBattleCharacterIdAndPictoName(
                battleId,
                battleCharacterId,
                pictoName
        )

        val tracker = if (existingTracker != null) {
            // Atualizar tracker existente
            existingTracker.copy(
                    timesTriggered = existingTracker.timesTriggered + 1,
                    lastTurnTriggered = currentTurnNumber,
                    resetOnTurnEnd = effectType == "once-per-turn"
            )
        } else {
            // Criar novo tracker
            PictoEffectTracker(
                    battleId = battleId,
                    battleCharacterId = battleCharacterId,
                    pictoName = pictoName,
                    effectType = effectType,
                    timesTriggered = 1,
                    lastTurnTriggered = currentTurnNumber,
                    resetOnTurnEnd = effectType == "once-per-turn"
            )
        }

        return pictoEffectTrackerRepository.save(tracker)
    }

    /**
     * Reseta efeitos "once per turn" ao fim do turno
     */
    @Transactional
    fun resetTurn(battleId: Int, battleCharacterId: Int? = null) {
        val trackers = if (battleCharacterId != null) {
            pictoEffectTrackerRepository.findByBattleCharacterId(battleCharacterId)
        } else {
            pictoEffectTrackerRepository.findByBattleId(battleId)
        }

        // Filtrar apenas os que precisam ser resetados no fim do turno
        val toReset = trackers.filter { it.resetOnTurnEnd }

        // Para efeitos once-per-turn, podemos resetar o lastTurnTriggered
        // ou simplesmente deletar o tracker (mais simples)
        if (toReset.isNotEmpty()) {
            pictoEffectTrackerRepository.deleteAll(toReset)
        }
    }

    /**
     * Obtém o número do turno atual baseado na ordem de jogada
     * Considera que cada rodada completa incrementa o turno
     */
    private fun getCurrentTurnNumber(battleId: Int): Int {
        val turns = battleTurnRepository.findByBattleIdOrderByPlayOrderAsc(battleId)

        if (turns.isEmpty()) {
            return 1
        }

        // O turno atual é baseado no menor playOrder disponível
        // Assumindo que cada vez que a lista é percorrida, é uma nova rodada
        val minOrder = turns.minOfOrNull { it.playOrder } ?: 1
        val maxOrder = turns.maxOfOrNull { it.playOrder } ?: 1

        // Calcular número aproximado de rodadas completadas
        // Se há 4 personagens e já foram 10 turnos, estamos na rodada 3
        val totalCharacters = turns.distinctBy { it.battleCharacterId }.size

        if (totalCharacters == 0) return 1

        // Turno atual baseado no primeiro da lista (menor playOrder)
        return ((maxOrder - minOrder) / totalCharacters) + 1
    }

    /**
     * Obtém informações de tracking de um efeito
     */
    fun getTracker(
            battleId: Int,
            battleCharacterId: Int,
            pictoName: String
    ): PictoEffectTracker? {
        return pictoEffectTrackerRepository.findByBattleIdAndBattleCharacterIdAndPictoName(
                battleId,
                battleCharacterId,
                pictoName
        )
    }

    /**
     * Lista todos os trackers de uma batalha
     */
    fun listTrackersByBattle(battleId: Int): List<PictoEffectTracker> {
        return pictoEffectTrackerRepository.findByBattleId(battleId)
    }

    /**
     * Lista todos os trackers de um personagem
     */
    fun listTrackersByCharacter(battleCharacterId: Int): List<PictoEffectTracker> {
        return pictoEffectTrackerRepository.findByBattleCharacterId(battleCharacterId)
    }

    /**
     * Remove todos os trackers de uma batalha (útil quando a batalha termina)
     */
    @Transactional
    fun clearBattle(battleId: Int) {
        pictoEffectTrackerRepository.deleteByBattleId(battleId)
    }
}
