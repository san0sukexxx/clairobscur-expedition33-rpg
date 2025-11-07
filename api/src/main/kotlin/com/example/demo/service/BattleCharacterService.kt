package com.example.demo.service

import com.example.demo.dto.AddBattleCharacterRequest
import com.example.demo.model.BattleCharacter
import com.example.demo.model.BattleInitiative
import com.example.demo.repository.BattleCharacterRepository
import com.example.demo.repository.BattleInitiativeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BattleCharacterService(
        private val repository: BattleCharacterRepository,
        private val initiativeRepository: BattleInitiativeRepository
) {
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
                        canRollInitiative = request.canRollInitiative
                )

        val savedCharacter = repository.save(entity)

        request.initiative?.let {
            val initiative =
                    BattleInitiative(
                            battleId = battleId,
                            battleCharacterId = savedCharacter.id!!,
                            initiativeValue = it.initiativeValue,
                            hability = it.hability,
                            playFirst = it.playFirst
                    )

            initiativeRepository.save(initiative)
        }

        return savedCharacter.id!!
    }

    @Transactional
    fun removeCharacter(id: Int) {
        if (initiativeRepository.existsByBattleCharacterId(id)) {
            initiativeRepository.deleteByBattleCharacterId(id)
        }

        if (repository.existsById(id)) {
            repository.deleteById(id)
        }
    }

    fun listCharacters(battleId: Int): List<BattleCharacter> {
        return repository.findByBattleId(battleId)
    }
}
