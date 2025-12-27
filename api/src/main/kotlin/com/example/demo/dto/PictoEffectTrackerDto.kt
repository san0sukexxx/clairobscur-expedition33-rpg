package com.example.demo.dto

data class TrackEffectRequest(
        val battleId: Int,
        val battleCharacterId: Int,
        val pictoName: String,
        val effectType: String
)

data class CanActivateResponse(
        val canActivate: Boolean,
        val timesTriggered: Int = 0,
        val lastTurnTriggered: Int? = null
)

data class PictoEffectTrackerResponse(
        val id: Int,
        val battleId: Int,
        val battleCharacterId: Int,
        val pictoName: String,
        val effectType: String,
        val timesTriggered: Int,
        val lastTurnTriggered: Int?,
        val resetOnTurnEnd: Boolean
)

data class ResetTurnRequest(
        val battleCharacterId: Int? = null
)
