package com.example.demo.service

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.model.BattleCharacter
import com.example.demo.repository.BattleCharacterRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleCharacterService(private val repository: BattleCharacterRepository) {
    @Transactional
    fun addCharacter(battleId: Int, request: AddBattleCharacterRequest): Int {
        val isEnemy = request.team.equals("B", ignoreCase = true)

        val entity =
                BattleCharacter(
                        battleId = battleId,
                        externalId = request.externalId,
                        characterName = request.characterName,
                        characterType = request.characterType,
                        isEnemy = isEnemy,
                        healthPoints = request.healthPoints,
                        maxHealthPoints = request.maxHealthPoints,
                        magicPoints = request.magicPoints,
                        maxMagicPoints = request.maxMagicPoints,
                        canRollInitiative = false
                )

        return repository.save(entity).id!!
    }

    @Transactional
    fun removeCharacter(id: Int) {
        if (repository.existsById(id)) {
            repository.deleteById(id)
        }
    }

    fun listCharacters(battleId: Int): List<BattleCharacter> {
        return repository.findByBattleId(battleId)
    }
}
