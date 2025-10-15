package com.example.demo.dto

import com.example.demo.model.Player

data class PlayerSheetResponse(
        val name: String?,
        val characterId: String?,
        val totalPoints: Int,
        val xp: Int,
        val power: Int,
        val hability: Int,
        val resistance: Int,
        val apCurrent: Int,
        val mpCurrent: Int,
        val hpCurrent: Int,
        val notes: String?,
        val weaponId: String?
) {
        companion object {
                fun fromEntity(p: Player) =
                        PlayerSheetResponse(
                                name = p.name,
                                characterId = p.characterId,
                                totalPoints = p.totalPoints,
                                xp = p.xp,
                                power = p.power,
                                hability = p.hability,
                                resistance = p.resistance,
                                apCurrent = p.apCurrent,
                                mpCurrent = p.mpCurrent,
                                hpCurrent = p.hpCurrent,
                                notes = p.notes,
                                weaponId = p.weaponId
                        )
        }
}
