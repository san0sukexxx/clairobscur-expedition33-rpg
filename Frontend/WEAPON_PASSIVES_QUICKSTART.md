# Weapon Passives - Quick Start Guide

## 🚀 Copy & Paste Integration

Este guia fornece código pronto para copiar e colar no PlayerPage.tsx.

---

## Step 1: Add Imports

Adicione no topo do arquivo `PlayerPage.tsx`:

```typescript
// Add after other imports
import {
  executeWeaponPassives,
  clearBattleWeaponTracking,
  clearTurnWeaponTracking,
  clearBattleStackingEffects,
  type WeaponPassiveTrigger
} from "../utils/WeaponPassives_Index";
```

---

## Step 2: Add Weapon Level State

Adicione ao estado do componente:

```typescript
// Add with other useState declarations
const [weaponLevel, setWeaponLevel] = useState<number>(20); // Default to max level for testing
```

---

## Step 3: Load Weapon Level

Adicione dentro do useEffect que carrega o player:

```typescript
useEffect(() => {
  if (player?.playerSheet?.weaponId && weaponInfo.weapon) {
    // TODO: Load from backend when weapon_level field is added
    // For now, use max level (20) to test all passives
    setWeaponLevel(20);

    // Future implementation:
    // const level = weaponInfo.weapon.level || 1;
    // setWeaponLevel(level);
  }
}, [player?.playerSheet?.weaponId, weaponInfo]);
```

---

## Step 4: Helper Function

Adicione esta função helper no componente:

```typescript
/**
 * Execute weapon passives for current player
 */
const executePlayerWeaponPassives = useCallback(
  async (
    trigger: WeaponPassiveTrigger,
    target?: BattleCharacterInfo,
    additionalData?: any
  ) => {
    if (!player?.fightInfo || !weaponInfo.weapon) return [];

    const playerChar = player.fightInfo.players?.find(
      p => p.characterId === player.id
    );

    if (!playerChar) return [];

    const allChars = [
      ...(player.fightInfo.players || []),
      ...(player.fightInfo.npcs || [])
    ];

    return await executeWeaponPassives(
      trigger,
      playerChar,
      allChars,
      player.fightInfo.battleId,
      weaponInfo.weapon.name,
      weaponLevel,
      target,
      additionalData
    );
  },
  [player, weaponInfo, weaponLevel]
);
```

---

## Step 5: Battle Start Integration

Encontre onde a batalha começa e adicione:

```typescript
// When battle starts
async function onBattleStart() {
  // Execute weapon passives
  const results = await executePlayerWeaponPassives("on-battle-start");

  // Log results
  if (results.length > 0) {
    console.log("[Weapon Passives] Battle start:", results);
    results.forEach(r => {
      if (r.message) showToast(r.message);
    });
  }
}
```

---

## Step 6: Turn Start Integration

Encontre onde o turno começa e adicione:

```typescript
// When player's turn starts
async function onTurnStart() {
  // Clear once-per-turn effects
  if (player?.fightInfo) {
    clearTurnWeaponTracking(player.fightInfo.battleId);
  }

  // Execute weapon passives
  const results = await executePlayerWeaponPassives("on-turn-start");

  if (results.length > 0) {
    console.log("[Weapon Passives] Turn start:", results);
  }
}
```

---

## Step 7: Base Attack Integration

Modifique a função de ataque básico:

```typescript
async function handleBaseAttack(target: BattleCharacterInfo) {
  try {
    // Calculate base damage
    let baseDamage = calculateAttackDamage(/* your parameters */);

    // Execute BEFORE damage passives
    const beforeResults = await executePlayerWeaponPassives(
      "on-base-attack",
      target,
      { damageAmount: baseDamage }
    );

    // Apply damage modification
    const modifiedResult = beforeResults.find(r => r.modifiedDamage);
    if (modifiedResult?.modifiedDamage) {
      console.log(`[Weapon Passives] Damage modified: ${baseDamage} -> ${modifiedResult.modifiedDamage}`);
      baseDamage = modifiedResult.modifiedDamage;
    }

    // Apply damage
    await APIBattle.applyDamage(target.battleID, baseDamage);

    // Execute AFTER damage passives
    const afterResults = await executePlayerWeaponPassives(
      "on-damage-dealt",
      target,
      {
        damageAmount: baseDamage,
        criticalHit: false // TODO: Check if was critical
      }
    );

    // Check for extra turn
    const hasExtraTurn = [...beforeResults, ...afterResults].some(r => r.extraTurn);
    if (hasExtraTurn) {
      showToast("Extra turn granted!");
      // TODO: Implement extra turn logic
    }

    // Show messages
    [...beforeResults, ...afterResults].forEach(r => {
      if (r.message) showToast(r.message);
    });

  } catch (error) {
    console.error("Error in base attack:", error);
  }
}
```

---

## Step 8: Skill Usage Integration

Modifique a função que usa skills:

```typescript
async function handleUseSkill(skill: any, target?: BattleCharacterInfo) {
  try {
    // Calculate skill damage
    let skillDamage = calculateSkillHitDamage(skill, target);

    // Execute weapon passives
    const results = await executePlayerWeaponPassives(
      "on-skill-used",
      target,
      {
        skillElement: skill.element,
        skillName: skill.name,
        skillType: skill.type,
        damageAmount: skillDamage
      }
    );

    // Apply damage modification
    const modifiedResult = results.find(r => r.modifiedDamage);
    if (modifiedResult?.modifiedDamage) {
      skillDamage = modifiedResult.modifiedDamage;
    }

    // Execute skill
    await resolveSkill(skill, target, skillDamage);

    // Show messages
    results.forEach(r => {
      if (r.message) showToast(r.message);
    });

  } catch (error) {
    console.error("Error using skill:", error);
  }
}
```

---

## Step 9: Critical Hit Integration

Quando um critical hit ocorre:

```typescript
async function onCriticalHit(target: BattleCharacterInfo) {
  const results = await executePlayerWeaponPassives(
    "on-critical-hit",
    target
  );

  results.forEach(r => {
    if (r.message) showToast(r.message);
  });
}
```

---

## Step 10: Damage Taken Integration

Quando o player toma dano:

```typescript
async function onPlayerDamageTaken(attacker: BattleCharacterInfo, damage: number) {
  const results = await executePlayerWeaponPassives(
    "on-damage-taken",
    attacker,
    { damageAmount: damage }
  );

  results.forEach(r => {
    if (r.message) showToast(r.message);
  });
}
```

---

## Step 11: Counterattack Integration

Quando o player contra-ataca:

```typescript
async function handleCounterattack(target: BattleCharacterInfo) {
  let counterDamage = calculateMaxCounterDamage(/* parameters */);

  // Execute passives
  const results = await executePlayerWeaponPassives(
    "on-counterattack",
    target,
    { damageAmount: counterDamage }
  );

  // Apply damage modification
  const modifiedResult = results.find(r => r.modifiedDamage);
  if (modifiedResult?.modifiedDamage) {
    counterDamage = modifiedResult.modifiedDamage;
  }

  // Apply damage
  await APIBattle.applyDamage(target.battleID, counterDamage);

  // Show messages
  results.forEach(r => {
    if (r.message) showToast(r.message);
  });
}
```

---

## Step 12: Battle End Cleanup

Quando a batalha termina:

```typescript
function onBattleEnd() {
  if (player?.fightInfo) {
    clearBattleWeaponTracking(player.fightInfo.battleId);
    clearBattleStackingEffects(player.fightInfo.battleId);
  }
}
```

---

## 🎯 Testing Checklist

### Test 1: Basic Damage Modifier
1. Equip **Abysseram** (Sword)
2. Set `weaponLevel = 10`
3. Use Base Attack
4. **Expected**: Damage increased by 50%
5. **Console**: Should show "Abysseram enhances Base Attack!"

### Test 2: Stacking Effect
1. Equip **Chevalam** (Sword)
2. Set `weaponLevel = 10`
3. Complete 3 turns without taking damage
4. Attack
5. **Expected**: Damage increased by 60% (3 stacks × 20%)
6. Take damage
7. **Expected**: Stacks reset to 0

### Test 3: Once-per-Battle
1. Equip **Baguette**
2. Set `weaponLevel = 10`
3. Die (reduce HP to 0)
4. **Expected**: Revive with 100% HP
5. Die again
6. **Expected**: No revive (already used once)

### Test 4: Burn Application
1. Equip **Brulerum** (Maelle)
2. Set `weaponLevel = 10`
3. Use Base Attack
4. **Expected**: Target receives 2 Burn stacks

### Test 5: AP Gain
1. Equip **Blodam** (Sword)
2. Set `weaponLevel = 20`
3. Rank up (D -> C)
4. **Expected**: Gain 1 AP

---

## 🐛 Quick Debug

### Check if Passives Are Executing

```typescript
// Add temporary logging
const results = await executePlayerWeaponPassives("on-base-attack");
console.log("Passive Results:", results);
console.log("Weapon:", weaponInfo.weapon?.name);
console.log("Weapon Level:", weaponLevel);
```

### Check Active Passives

```typescript
// Log which passives should be active
const activePassives = [4, 10, 20].filter(level => weaponLevel >= level);
console.log(`Active passive levels for ${weaponInfo.weapon?.name}:`, activePassives);
```

### Check Stacks

```typescript
import { getStacks } from '../utils/WeaponPassiveEffects';

// Check damage stacks for Chevalam
if (weaponInfo.weapon?.name === "Chevalam" && player?.fightInfo) {
  const stacks = getStacks(
    player.fightInfo.battleId,
    playerChar.battleID,
    "Chevalam-DamageStacks"
  );
  console.log("Chevalam damage stacks:", stacks);
}
```

---

## 📝 Common Issues

### Issue: Passives not executing
**Solution**: Check that:
1. Import is correct
2. `weaponInfo.weapon` is not null
3. `weaponLevel >= passive level`
4. Trigger matches passive condition

### Issue: Damage not modified
**Solution**: Check that:
1. You're using `modifiedDamage` from result
2. Trigger is correct (e.g., "on-base-attack" not "on-damage-dealt")
3. Passive conditions are met (e.g., correct Rank)

### Issue: Messages not showing
**Solution**: Add:
```typescript
results.forEach(r => {
  if (r.message) {
    console.log("[Weapon Passive]", r.message);
    showToast(r.message);
  }
});
```

### Issue: Stacks not resetting
**Solution**: Make sure to call:
```typescript
clearTurnWeaponTracking(battleId); // On turn start
clearBattleWeaponTracking(battleId); // On battle end
```

---

## 🎨 Optional: UI Indicators

### Show Active Passives in UI

```typescript
// In your weapon info display component
const activePassives = weaponInfo.details?.passives
  ?.filter(p => weaponLevel >= p.level)
  ?.map(p => ({
    level: p.level,
    effect: p.effect
  }));

return (
  <div className="weapon-passives">
    <h3>Active Passives</h3>
    {activePassives?.map(p => (
      <div key={p.level} className="passive-item">
        <span className="passive-level">Level {p.level}</span>
        <span className="passive-effect">{p.effect}</span>
      </div>
    ))}
  </div>
);
```

### Show Passive Triggers in Battle Log

```typescript
// Add to battle log component
function logWeaponPassive(passiveName: string, effect: string) {
  addBattleLogEntry({
    type: "weapon-passive",
    message: `[${passiveName}] ${effect}`,
    timestamp: Date.now()
  });
}

// Use in passive execution
const results = await executePlayerWeaponPassives("on-base-attack");
results.forEach(r => {
  if (r.message) {
    logWeaponPassive(weaponInfo.weapon.name, r.message);
  }
});
```

---

## ✅ Done!

Você agora tem:
- ✅ Sistema de passivas integrado
- ✅ Modificadores de dano funcionando
- ✅ Efeitos de status aplicados
- ✅ Stacking effects
- ✅ Once-per-battle effects
- ✅ Logs e debugging

**Próximo passo**: Testar com diferentes armas e verificar que as passivas estão funcionando corretamente!

---

## 📚 Additional Resources

- **Full Integration Guide**: `WEAPON_PASSIVES_INTEGRATION.md`
- **System Summary**: `WEAPON_PASSIVES_SUMMARY.md`
- **Implementation Details**: `src/utils/WeaponPassives_Index.ts`

---

**Need Help?**
- Check console logs for detailed execution info
- Verify weapon name matches exactly (case-sensitive)
- Ensure weapon level is correct
- Test with max level (20) first to enable all passives
