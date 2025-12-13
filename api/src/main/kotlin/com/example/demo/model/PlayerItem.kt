package com.example.demo.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
        name = "player_items",
        uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "item_id"])]
)
data class PlayerItem(
        @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int = 0,
        @Column(name = "player_id", nullable = false) val playerId: Int,
        @Column(name = "item_id", nullable = false) val itemId: String,
        @Column(nullable = false) val quantity: Int = 1,
        @Column(name = "max_quantity", nullable = false) val maxQuantity: Int = 99
)
