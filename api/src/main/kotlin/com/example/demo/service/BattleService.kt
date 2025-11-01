package com.example.demo.service

import com.example.demo.dto.CreateBattleRequest
import com.example.demo.model.Battle
import com.example.demo.repository.BattleRepository
import org.springframework.stereotype.Service

@Service
class BattleService(private val battleRepository: BattleRepository) {
    fun create(request: CreateBattleRequest): Int {
        val battle = Battle(campaignId = request.campaignId, battleStatus = request.battleStatus)

        val saved = battleRepository.save(battle)
        return saved.id!!
    }
}
