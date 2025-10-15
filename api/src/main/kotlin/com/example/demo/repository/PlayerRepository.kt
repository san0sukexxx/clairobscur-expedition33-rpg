package com.example.demo.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import com.example.demo.model.Player

@Repository interface PlayerRepository : JpaRepository<Player, Int>
