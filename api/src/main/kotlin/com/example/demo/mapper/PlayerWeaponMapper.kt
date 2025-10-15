package com.example.demo.mapper

import com.example.demo.dto.PlayerWeaponResponse
import com.example.demo.model.PlayerWeapon

fun PlayerWeapon.toResponse(): PlayerWeaponResponse =
    PlayerWeaponResponse(
        id = this.weaponId,
        level = this.weaponLevel
    )
