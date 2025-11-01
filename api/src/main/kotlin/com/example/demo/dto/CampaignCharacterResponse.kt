package com.example.demo.dto

import com.example.demo.model.CampaignCharacter

data class CampaignCharacterResponse(val id: Int, val character: String) {
    companion object {
        fun fromEntity(entity: CampaignCharacter) =
                CampaignCharacterResponse(id = entity.id ?: 0, character = entity.character)
    }
}
