# Weapon Passives System - Integration Guide

## Overview

Sistema completo de passivas de armas implementado com 108 armas e ~300 efeitos passivos únicos.

### Arquivos Criados

1. **WeaponPassiveEffects.ts** - Sistema base + passivas de espadas (27 armas)
2. **WeaponPassiveEffects_Lune.ts** - Passivas de Lune (23 armas)
3. **WeaponPassiveEffects_All.ts** - Passivas de Maelle (24), Monoco (12), Sciel (22)
4. **WeaponPassives_Index.ts** - Índice principal e documentação

## Integração com PlayerPage.tsx

### Passo 1: Importar Sistema

```typescript
// No topo do PlayerPage.tsx, adicionar:
import {
  executeWeaponPassives,
  clearBattleWeaponTracking,
  clearTurnWeaponTracking,
  clearBattleStackingEffects
} from "../utils/WeaponPassives_Index";
```

### Passo 2: Adicionar Rastreamento de Nível de Arma

```typescript
// Adicionar ao estado do componente:
const [weaponLevel, setWeaponLevel] = useState<number>(1);

// Carregar do backend quando player é carregado:
useEffect(() => {
  if (player?.playerSheet?.weaponId && weaponInfo.weapon) {
    // TODO: Buscar weapon_level do backend
    // setWeaponLevel(weaponInfo.weapon.level || 1);
    setWeaponLevel(20); // Temporário: assumir nível máximo para testes
  }
}, [player, weaponInfo]);
```

### Passo 3: Executar Passivas em Pontos-Chave

#### 3.1 On Battle Start

```typescript
// Na função que inicia a batalha, adicionar:
async function onBattleStart() {
  const playerChar = fightInfo?.players?.find(p => p.characterId === player.id);
  if (playerChar && weaponInfo.weapon) {
    await executeWeaponPassives(
      "on-battle-start",
      playerChar,
      [...(fightInfo?.players || []), ...(fightInfo?.npcs || [])],
      fightInfo.battleId,
      weaponInfo.weapon.name,
      weaponLevel
    );
  }
}
```

#### 3.2 On Turn Start

```typescript
// Na função handleStartTurn ou similar:
async function onTurnStart(character: BattleCharacterInfo) {
  if (weaponInfo.weapon) {
    // Limpar efeitos "once-per-turn"
    clearTurnWeaponTracking(fightInfo.battleId);

    await executeWeaponPassives(
      "on-turn-start",
      character,
      getAllCharacters(),
      fightInfo.battleId,
      weaponInfo.weapon.name,
      weaponLevel
    );
  }
}
```

#### 3.3 On Base Attack

```typescript
// Na função handleAttack quando attackType === "basic":
async function handleBaseAttack(attacker: BattleCharacterInfo, defender: BattleCharacterInfo) {
  let baseDamage = calculateAttackDamage(/* ... */);

  // Executar passivas ANTES de aplicar dano
  const passiveResults = await executeWeaponPassives(
    "on-base-attack",
    attacker,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    defender,
    { damageAmount: baseDamage }
  );

  // Aplicar modificadores de dano
  const modifiedResult = passiveResults.find(r => r.modifiedDamage);
  if (modifiedResult?.modifiedDamage) {
    baseDamage = modifiedResult.modifiedDamage;
  }

  // Verificar extra turn
  const hasExtraTurn = passiveResults.some(r => r.extraTurn);
  if (hasExtraTurn) {
    // TODO: Implementar lógica de turno extra
  }

  // Aplicar dano ao defender
  await APIBattle.applyDamage(defender.battleID, baseDamage);

  // Executar passivas DEPOIS de aplicar dano
  await executeWeaponPassives(
    "on-damage-dealt",
    attacker,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    defender,
    { damageAmount: baseDamage, criticalHit: wasCrit }
  );
}
```

#### 3.4 On Skill Used

```typescript
// Na função handleUseSkill:
async function handleUseSkill(skill: Skill, target?: BattleCharacterInfo) {
  const skillDamage = calculateSkillHitDamage(/* ... */);

  // Executar passivas de skill
  const passiveResults = await executeWeaponPassives(
    "on-skill-used",
    playerChar,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    target,
    {
      skillElement: skill.element,
      skillName: skill.name,
      skillType: skill.type, // "Physical", "Fire", "Support", etc.
      damageAmount: skillDamage
    }
  );

  // Aplicar modificadores de dano
  const modifiedResult = passiveResults.find(r => r.modifiedDamage);
  if (modifiedResult?.modifiedDamage) {
    skillDamage = modifiedResult.modifiedDamage;
  }

  // Aplicar dano
  await resolveSkill(skill, target, skillDamage);
}
```

#### 3.5 On Critical Hit

```typescript
// Após determinar que um ataque foi crítico:
async function onCriticalHit(attacker: BattleCharacterInfo, target: BattleCharacterInfo) {
  await executeWeaponPassives(
    "on-critical-hit",
    attacker,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    target
  );
}
```

#### 3.6 On Damage Taken

```typescript
// Quando um personagem recebe dano:
async function onDamageTaken(defender: BattleCharacterInfo, attacker: BattleCharacterInfo, damage: number) {
  await executeWeaponPassives(
    "on-damage-taken",
    defender,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    attacker,
    { damageAmount: damage }
  );
}
```

#### 3.7 On Counterattack

```typescript
// Na função handleCounter:
async function handleCounterattack(counterattacker: BattleCharacterInfo, target: BattleCharacterInfo) {
  let counterDamage = calculateMaxCounterDamage(/* ... */);

  // Executar passivas
  const passiveResults = await executeWeaponPassives(
    "on-counterattack",
    counterattacker,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    target,
    { damageAmount: counterDamage }
  );

  // Aplicar modificadores
  const modifiedResult = passiveResults.find(r => r.modifiedDamage);
  if (modifiedResult?.modifiedDamage) {
    counterDamage = modifiedResult.modifiedDamage;
  }

  await APIBattle.applyDamage(target.battleID, counterDamage);
}
```

#### 3.8 On Free Aim

```typescript
// Na função handleFreeAim:
async function handleFreeAim(shooter: BattleCharacterInfo, target: BattleCharacterInfo) {
  let freeAimDamage = calculateFreeShotPlus(/* ... */);

  // Executar passivas
  const passiveResults = await executeWeaponPassives(
    "on-free-aim",
    shooter,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    target,
    { damageAmount: freeAimDamage }
  );

  // Aplicar modificadores
  const modifiedResult = passiveResults.find(r => r.modifiedDamage);
  if (modifiedResult?.modifiedDamage) {
    freeAimDamage = modifiedResult.modifiedDamage;
  }

  await APIBattle.applyDamage(target.battleID, freeAimDamage);
}
```

### Passo 4: Triggers Avançados

#### 4.1 Rank Change (Perfection System)

```typescript
// Quando o rank de perfection muda:
async function onRankChange(character: BattleCharacterInfo, oldRank: string, newRank: string) {
  await executeWeaponPassives(
    "on-rank-change",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { oldRank, newRank }
  );
}
```

#### 4.2 Stance Change (Maelle)

```typescript
// Quando a stance de Maelle muda:
async function onStanceChange(character: BattleCharacterInfo, oldStance: string, newStance: string) {
  await executeWeaponPassives(
    "on-stance-change",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { oldStance, newStance }
  );
}
```

#### 4.3 Mask Change (Monoco)

```typescript
// Quando a máscara de Monoco muda:
async function onMaskChange(character: BattleCharacterInfo, oldMask: string, newMask: string) {
  await executeWeaponPassives(
    "on-mask-change",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { oldMask, newMask }
  );
}
```

#### 4.4 Stain System (Lune)

```typescript
// Quando stains são consumidos:
async function onStainConsumed(character: BattleCharacterInfo, stainsConsumed: string[]) {
  await executeWeaponPassives(
    "on-stain-consumed",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { stainsConsumed }
  );
}

// Quando stains são gerados:
async function onStainGenerated(character: BattleCharacterInfo, stainsGenerated: string[]) {
  await executeWeaponPassives(
    "on-stain-generated",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { stainsGenerated }
  );
}
```

#### 4.5 Twilight System (Sciel)

```typescript
// Quando Sciel entra em Twilight:
async function onTwilightStart(character: BattleCharacterInfo, sunCharges: number, moonCharges: number) {
  await executeWeaponPassives(
    "on-twilight-start",
    character,
    getAllCharacters(),
    fightInfo.battleId,
    weaponInfo.weapon.name,
    weaponLevel,
    undefined,
    { isTwilight: true, sunCharges, moonCharges }
  );
}
```

### Passo 5: Limpeza de Efeitos

```typescript
// Quando a batalha termina:
function onBattleEnd(battleId: number) {
  clearBattleWeaponTracking(battleId);
  clearBattleStackingEffects(battleId);
}

// No início de cada turno:
function onTurnStart(battleId: number) {
  clearTurnWeaponTracking(battleId);
}
```

## Backend Requirements

### 1. Adicionar Campo weapon_level

```sql
-- Adicionar coluna weapon_level na tabela player_weapon
ALTER TABLE player_weapon ADD COLUMN weapon_level INTEGER DEFAULT 1;

-- Criar índice para performance
CREATE INDEX idx_player_weapon_level ON player_weapon(weapon_level);
```

### 2. Adicionar Endpoints

```typescript
// GET /api/player/:id/weapon/level
// Retorna o nível atual da arma equipada

// PUT /api/player/:id/weapon/level
// Atualiza o nível da arma
// Body: { weaponId: string, level: number }
```

### 3. Sistemas a Implementar

1. **AP System** - Sistema de Action Points completo
2. **Perfection/Rank System** - Rastreamento de ranks (D, C, B, A, S)
3. **Stance System (Maelle)** - Offensive, Defensive, Virtuose, Stanceless
4. **Mask System (Monoco)** - Bestial Wheel e diferentes máscaras
5. **Stain System (Lune)** - Fire, Ice, Lightning, Earth, Light, Dark stains
6. **Sun/Moon/Twilight (Sciel)** - Cargas e estado Twilight
7. **Foretell Mechanic** - Marcadores de Foretell em inimigos
8. **Shield System** - Ganho, quebra e roubo de shields
9. **Turn Order Modification** - "Play first" e extra turns
10. **Damage Type Conversion** - Conversão de elementos

## Exemplos de Uso

### Exemplo 1: Abysseram (Sword)

```typescript
// Passiva L4: "50% increased damage on Rank D"
// Passiva L10: "50% increased Base Attack damage"
// Passiva L20: "On Rank D, recover 20% Health with Base Attack"

// No handleBaseAttack:
const results = await executeWeaponPassives(
  "on-base-attack",
  player,
  allChars,
  battleId,
  "Abysseram",
  12, // Nível 12 ativa L4 e L10, mas não L20
  target,
  { damageAmount: 100 }
);

// Se player está em Rank D, L4 modifica dano de 100 para 150
// L10 modifica novamente de 150 para 225 (150 * 1.5)
// L20 não executa pois weaponLevel < 20
```

### Exemplo 2: Baguette (All Characters)

```typescript
// Passiva L4: "Kill self on battle start"
// Passiva L10: "Revive with 100% Health. Once per battle"
// Passiva L20: "Play first"

// On battle start:
await executeWeaponPassives("on-battle-start", player, allChars, battleId, "Baguette", 20);
// -> Player morre

// On death:
await executeWeaponPassives("on-death", player, allChars, battleId, "Baguette", 20);
// -> Player revive com 100% HP (uma vez por batalha)
```

### Exemplo 3: Chevalam (Sword)

```typescript
// Passiva L10: "20% increased damage for each consecutive turn without taking damage. Can stack up to 5 times."

// Turno 1: Player não toma dano
await executeWeaponPassives("on-turn-start", player, allChars, battleId, "Chevalam", 10);
// -> Stacks = 1 (+20% dano)

// Turno 2: Player não toma dano
await executeWeaponPassives("on-turn-start", player, allChars, battleId, "Chevalam", 10);
// -> Stacks = 2 (+40% dano)

// Turno 3: Player TOMA dano
await executeWeaponPassives("on-damage-taken", player, allChars, battleId, "Chevalam", 10);
// -> Stacks resetam para 0

// Próximo ataque:
const results = await executeWeaponPassives("on-damage-dealt", player, allChars, battleId, "Chevalam", 10, target, { damageAmount: 100 });
// -> Dano modificado baseado em stacks
```

## Debugging

### Logs de Passivas

```typescript
// Todas as passivas logam no console quando executam:
console.log("[Weapon Passive] Executing Abysseram L10: 50% increased Base Attack damage");

// Para debug completo, ativar logs detalhados:
const results = await executeWeaponPassives(/* ... */);
console.log("Passive Results:", results);
// Output:
// [
//   { success: true, modifiedDamage: 225, message: "Abysseram enhances Base Attack!" },
//   { success: true, message: "Player recovered 50 HP!" }
// ]
```

### Verificar Passivas Ativas

```typescript
// Verificar quais passivas estão ativas para um nível:
const activePassives = [4, 10, 20].filter(level => weaponLevel >= level);
console.log("Active passives:", activePassives);
// Output para weaponLevel=12: [4, 10]
```

## Testing

### Teste Manual Básico

1. Equipar Abysseram (Sword)
2. Definir weaponLevel = 10
3. Entrar em batalha
4. Usar Base Attack
5. Verificar que dano foi aumentado em 50%

### Teste de Stacking

1. Equipar Chevalam (Sword)
2. Definir weaponLevel = 10
3. Passar 3 turnos sem tomar dano
4. Atacar e verificar +60% de dano (3 stacks)
5. Tomar dano e verificar que stacks resetam

### Teste Once-per-Battle

1. Equipar Baguette
2. Definir weaponLevel = 10
3. Morrer
4. Verificar que revive com 100% HP
5. Morrer novamente
6. Verificar que NÃO revive (once-per-battle)

## Notas Importantes

### Passivas Não Implementadas (Armas Vazias)

- Noahram (Sword) - Sem passivas
- Verleso (Sword) - Sem passivas
- Lunerim (Lune) - Sem passivas
- Maellum (Maelle) - Sem passivas
- Scieleson (Sciel) - Sem passivas

### Passivas com TODO

Algumas passivas têm marcadores TODO indicando sistemas que precisam ser implementados:

- **Perfection System**: Ganho/perda de perfection, modificadores de rank
- **Stance System**: Mudança automática de stance, bônus por stance
- **Mask System**: Bestial Wheel, mudança de máscara
- **Stain Tracking**: Contagem de stains ativos, geração/consumo
- **AP System**: Ganho/gasto de AP, modificação de custos
- **Turn Order**: Modificação de iniciativa, turnos extras
- **Shield Mechanics**: Quebra, roubo, consumo de shields
- **Gradient System**: Geração e uso de gradient charges

### Performance

O sistema é otimizado para não executar passivas desnecessárias:

1. Apenas passivas cujo nível foi alcançado são executadas
2. Passivas retornam `{ success: false }` quando condições não são atendidas
3. Tracking é in-memory para velocidade
4. Cleanup automático previne memory leaks

## Roadmap

### Fase 1: Core Integration (Atual)
- ✅ Sistema de passivas implementado
- ✅ Registry e tipos criados
- ⏳ Integração básica com PlayerPage.tsx

### Fase 2: Backend Support
- ⏳ Adicionar weapon_level ao banco
- ⏳ Endpoints de weapon level
- ⏳ AP system backend

### Fase 3: Advanced Systems
- ⏳ Perfection/Rank system
- ⏳ Stance system (Maelle)
- ⏳ Mask system (Monoco)
- ⏳ Stain system (Lune)
- ⏳ Sun/Moon/Twilight (Sciel)

### Fase 4: Polish
- ⏳ UI indicators para passivas ativas
- ⏳ Logs de batalha com passivas
- ⏳ Tooltips explicando efeitos
- ⏳ Animações visuais

## Suporte

Para dúvidas ou problemas:

1. Verificar console do browser para logs de passivas
2. Verificar WeaponPassives_Index.ts para documentação completa
3. Verificar arquivos individuais de passivas para detalhes de implementação
4. TODOs marcam funcionalidades pendentes

---

**Total de Passivas Implementadas**: ~300+
**Total de Armas**: 108
**Arquivos Criados**: 4
**Status**: Sistema completo pronto para integração
