package com.example.demo.repository

import com.example.demo.model.Campaign
import java.util.Optional
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CampaignRepository : JpaRepository<Campaign, Int> {
    @Query("SELECT c FROM Campaign c LEFT JOIN FETCH c.characters WHERE c.id = :id")
    fun findByIdWithCharacters(@Param("id") id: Int): Optional<Campaign>

    @Query("SELECT DISTINCT c FROM Campaign c LEFT JOIN FETCH c.characters")
    fun findAllWithCharacters(): List<Campaign>
}
