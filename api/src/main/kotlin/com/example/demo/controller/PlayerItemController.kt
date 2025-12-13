package com.example.demo.controller

import com.example.demo.dto.CreatePlayerItemRequest
import com.example.demo.dto.UpdatePlayerItemRequest
import com.example.demo.model.PlayerItem
import com.example.demo.repository.PlayerItemRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/player-items")
class PlayerItemController(private val repository: PlayerItemRepository) {

    @PostMapping
    fun create(@RequestBody body: CreatePlayerItemRequest): Int {
        val existing = repository.findByPlayerIdAndItemId(body.playerId, body.itemId)

        if (existing != null) {
            val newQuantity = minOf(existing.quantity + body.quantity, existing.maxQuantity)
            val updated = existing.copy(quantity = newQuantity)
            repository.save(updated)
            return existing.id
        }

        val entity =
                PlayerItem(
                        playerId = body.playerId,
                        itemId = body.itemId,
                        quantity = body.quantity,
                        maxQuantity = body.maxQuantity
                )

        return repository.save(entity).id
    }

    @PutMapping("/{id}")
    fun update(
            @PathVariable id: Int,
            @RequestBody body: UpdatePlayerItemRequest
    ): ResponseEntity<Void> {
        val opt = repository.findById(id)
        if (opt.isEmpty) {
            return ResponseEntity.notFound().build()
        }

        val item = opt.get()

        val newMaxQuantity = body.maxQuantity ?: item.maxQuantity
        val rawQuantity = body.quantity?.let { minOf(it, newMaxQuantity) } ?: item.quantity
        val newQuantity = maxOf(0, rawQuantity)

        val updated = item.copy(quantity = newQuantity, maxQuantity = newMaxQuantity)
        repository.save(updated)

        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }

        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
