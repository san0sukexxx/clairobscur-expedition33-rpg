package com.example.demo.dto

import com.example.demo.model.Player

data class PlayerSheetResponse(
        val name: String?,
        val characterId: String?,
        val totalPoints: Int,
        val xp: Int,
        val apCurrent: Int,
        val mpCurrent: Int,
        val hpCurrent: Int,
        val notes: String?,
        val weaponId: String?,
        val skillsData: String?,
        val hpMax: Int,
        val savingThrowProficiencies: List<String>?,
        val abilityScores: AbilityScoresDto,
        val luminaBonusPoints: Int,
        val bestialWheelReversed: Boolean
) {
        companion object {
                fun fromEntity(p: Player) =
                        PlayerSheetResponse(
                                name = p.name,
                                characterId = p.characterId,
                                totalPoints = p.totalPoints,
                                xp = p.xp,
                                apCurrent = p.apCurrent,
                                mpCurrent = p.mpCurrent,
                                hpCurrent = p.hpCurrent,
                                notes = p.notes,
                                weaponId = p.weaponId,
                                skillsData = p.skillsData,
                                hpMax = p.hpMax,
                                savingThrowProficiencies = p.savingThrowProficiencies
                                        ?.split(",")?.filter { it.isNotBlank() },
                                abilityScores = AbilityScoresDto(
                                        strength = p.strength,
                                        dexterity = p.dexterity,
                                        constitution = p.constitution,
                                        intelligence = p.intelligence,
                                        wisdom = p.wisdom,
                                        charisma = p.charisma
                                ),
                                luminaBonusPoints = p.luminaBonusPoints,
                                bestialWheelReversed = p.bestialWheelReversed
                        )
        }
}
