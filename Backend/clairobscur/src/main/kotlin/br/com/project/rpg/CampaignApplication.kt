package br.com.project.rpg

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CampaignApplication

fun main(args: Array<String>) {
	runApplication<CampaignApplication>(*args)
}