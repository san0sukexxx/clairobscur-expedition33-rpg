package com.example.demo.repository

import com.example.demo.model.Campaign
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface CampaignRepository : JpaRepository<Campaign, Int> {

    @Query("select distinct c from Campaign c left join fetch c.characters")
    fun findAllWithCharacters(): List<Campaign>
}
