package br.com.project.rpg.campaign.repository

import br.com.project.rpg.campaign.domain.Campaign
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

@Repository
class InMemoryCampaignRepository : CampaignRepository {
    private val seq = AtomicLong(1)
    private val store = ConcurrentHashMap<Long, Campaign>()

    override fun salvar(campaign: Campaign): Campaign {
        val id = seq.getAndIncrement()
        val nova = campaign.copy(
            id = id,
            criadoEm = campaign.criadoEm.takeIf { it != Instant.EPOCH } ?: Instant.now()
        )
        store[id] = nova
        return nova
    }
}
