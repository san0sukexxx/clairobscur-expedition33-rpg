package com.example.demo.config

import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class SecurityConfig(private val jdbcTemplate: JdbcTemplate) {

    @PostConstruct
    fun enableWalMode() {
        jdbcTemplate.execute("PRAGMA journal_mode=WAL;")
        jdbcTemplate.execute("PRAGMA synchronous=NORMAL;")
        jdbcTemplate.execute("PRAGMA busy_timeout=5000;")
        jdbcTemplate.execute("PRAGMA foreign_keys=ON;")
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOriginPatterns =
                listOf(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "http://192.168.*:*",
                        "http://10.*.*.*:*"
                )
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("Authorization", "Content-Type", "Accept")
        config.exposedHeaders = listOf("Location")
        config.allowCredentials = true
        config.maxAge = 3600

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http.cors {}.csrf { it.disable() }.authorizeHttpRequests { auth ->
            auth.requestMatchers("/**").permitAll()
        }

        return http.build()
    }
}
