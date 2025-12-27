# Exemplos de Testes - Sistema de Imunidades e Resistências

## Testes Postman/Insomnia

### 1. Setup Inicial

Primeiro, crie um personagem de teste na batalha:

```http
POST /api/battle/characters
Content-Type: application/json

{
  "battleId": 1,
  "externalId": "test-character",
  "characterName": "Test Character",
  "characterType": "enemy",
  "isEnemy": true,
  "healthPoints": 100,
  "maxHealthPoints": 100
}
```

Suponha que o ID retornado seja `15`.

### 2. Teste de Imunidade a Status

#### 2.1. Adicionar Imunidade a Burning

```http
POST /api/battle/characters/15/immunities
Content-Type: application/json

{
  "statusType": "Burning",
  "immunityType": "immune"
}
```

#### 2.2. Tentar Aplicar Burning (deve falhar)

```http
POST /api/battle-status/add
Content-Type: application/json

{
  "battleCharacterId": 15,
  "effectType": "Burning",
  "ammount": 5,
  "remainingTurns": 3
}
```

**Resultado esperado**: Status não aplicado, log de "STATUS_IMMUNE" criado.

#### 2.3. Verificar Imunidades

```http
GET /api/battle/characters/15/immunities
```

**Resposta esperada**:
```json
[
  {
    "id": 1,
    "battleCharacterId": 15,
    "statusType": "Burning",
    "immunityType": "immune",
    "resistChance": null
  }
]
```

#### 2.4. Remover Imunidade

```http
DELETE /api/battle/characters/15/immunities/Burning
```

#### 2.5. Aplicar Burning Novamente (deve funcionar agora)

```http
POST /api/battle-status/add
Content-Type: application/json

{
  "battleCharacterId": 15,
  "effectType": "Burning",
  "ammount": 5,
  "remainingTurns": 3
}
```

**Resultado esperado**: Status aplicado com sucesso.

### 3. Teste de Resistência a Status (baseada em chance)

#### 3.1. Adicionar Resistência 50% a Frozen

```http
POST /api/battle/characters/15/immunities
Content-Type: application/json

{
  "statusType": "Frozen",
  "immunityType": "resist",
  "resistChance": 50
}
```

#### 3.2. Tentar Aplicar Frozen Múltiplas Vezes

Execute este request 10 vezes:

```http
POST /api/battle-status/add
Content-Type: application/json

{
  "battleCharacterId": 15,
  "effectType": "Frozen",
  "ammount": 10,
  "remainingTurns": 2
}
```

**Resultado esperado**: Aproximadamente 5 tentativas devem funcionar, 5 devem ser resistidas.

### 4. Teste de Resistência Elemental

#### 4.1. Adicionar Resistência a Fire (50% de dano)

```http
POST /api/battle/characters/15/resistances
Content-Type: application/json

{
  "element": "Fire",
  "resistanceType": "resist",
  "multiplier": 0.5
}
```

#### 4.2. Aplicar Ataque de Fire (100 de dano)

Primeiro, crie um atacante:

```http
POST /api/battle/characters
Content-Type: application/json

{
  "battleId": 1,
  "externalId": "attacker",
  "characterName": "Attacker",
  "characterType": "player",
  "isEnemy": false,
  "healthPoints": 100,
  "maxHealthPoints": 100,
  "magicPoints": 10,
  "maxMagicPoints": 10
}
```

Suponha que o ID seja `16`.

Agora ataque com Fire:

```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 100,
  "element": "Fire",
  "targetBattleId": 15,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

**Resultado esperado**:
- Dano aplicado: 50 (100 * 0.5)
- HP do alvo: 50 (100 - 50)

#### 4.3. Verificar HP do Alvo

```http
GET /api/battle/characters/15
```

Verifique que o `healthPoints` é 50.

### 5. Teste de Imunidade Elemental

#### 5.1. Adicionar Imunidade a Ice

```http
POST /api/battle/characters/15/resistances
Content-Type: application/json

{
  "element": "Ice",
  "resistanceType": "immune",
  "multiplier": 0.0
}
```

#### 5.2. Aplicar Ataque de Ice (100 de dano)

```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 100,
  "element": "Ice",
  "targetBattleId": 15,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

**Resultado esperado**:
- Dano aplicado: 0 (imune)
- HP do alvo: permanece 50

### 6. Teste de Fraqueza Elemental

#### 6.1. Adicionar Fraqueza a Lightning (150% de dano)

```http
POST /api/battle/characters/15/resistances
Content-Type: application/json

{
  "element": "Lightning",
  "resistanceType": "weak",
  "multiplier": 1.5
}
```

#### 6.2. Aplicar Ataque de Lightning (100 de dano)

```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 100,
  "element": "Lightning",
  "targetBattleId": 15,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

**Resultado esperado**:
- Dano aplicado: 150 (100 * 1.5)
- HP do alvo: 0 (50 - 150 = negativo, clamped to 0)

### 7. Teste de Múltiplas Resistências

#### 7.1. Listar Todas as Resistências

```http
GET /api/battle/characters/15/resistances
```

**Resposta esperada**:
```json
[
  {
    "id": 1,
    "battleCharacterId": 15,
    "element": "Fire",
    "resistanceType": "resist",
    "damageMultiplier": 0.50
  },
  {
    "id": 2,
    "battleCharacterId": 15,
    "element": "Ice",
    "resistanceType": "immune",
    "damageMultiplier": 0.00
  },
  {
    "id": 3,
    "battleCharacterId": 15,
    "element": "Lightning",
    "resistanceType": "weak",
    "damageMultiplier": 1.50
  }
]
```

#### 7.2. Atualizar Resistência Existente

```http
POST /api/battle/characters/15/resistances
Content-Type: application/json

{
  "element": "Fire",
  "resistanceType": "resist",
  "multiplier": 0.25
}
```

**Resultado esperado**: Resistência a Fire atualizada para 75% de redução (0.25 multiplier).

#### 7.3. Remover Resistência

```http
DELETE /api/battle/characters/15/resistances/Fire
```

### 8. Teste de Ataque sem Elemento

#### 8.1. Aplicar Ataque sem Elemento Especificado

```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 100,
  "targetBattleId": 15,
  "sourceBattleId": 16,
  "attackType": "basic",
  "effects": []
}
```

**Resultado esperado**: Dano aplicado normalmente (100), sem considerar resistências elementais.

### 9. Teste de Combinação: Imunidades + Resistências

#### 9.1. Criar Novo Personagem Boss

```http
POST /api/battle/characters
Content-Type: application/json

{
  "battleId": 1,
  "externalId": "fire-boss",
  "characterName": "Fire Elemental Boss",
  "characterType": "enemy",
  "isEnemy": true,
  "healthPoints": 1000,
  "maxHealthPoints": 1000
}
```

Suponha que o ID seja `17`.

#### 9.2. Adicionar Múltiplas Proteções

Imune a Burning:
```http
POST /api/battle/characters/17/immunities
Content-Type: application/json

{
  "statusType": "Burning",
  "immunityType": "immune"
}
```

Imune a Fire:
```http
POST /api/battle/characters/17/resistances
Content-Type: application/json

{
  "element": "Fire",
  "resistanceType": "immune",
  "multiplier": 0.0
}
```

Fraco a Ice:
```http
POST /api/battle/characters/17/resistances
Content-Type: application/json

{
  "element": "Ice",
  "resistanceType": "weak",
  "multiplier": 2.0
}
```

Resistência 75% a Lightning:
```http
POST /api/battle/characters/17/resistances
Content-Type: application/json

{
  "element": "Lightning",
  "resistanceType": "resist",
  "multiplier": 0.25
}
```

#### 9.3. Testar Ataques

Fire Attack (deve causar 0 de dano):
```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 200,
  "element": "Fire",
  "targetBattleId": 17,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

Ice Attack (deve causar 400 de dano):
```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 200,
  "element": "Ice",
  "targetBattleId": 17,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

Lightning Attack (deve causar 50 de dano):
```http
POST /api/attacks
Content-Type: application/json

{
  "totalDamage": 200,
  "element": "Lightning",
  "targetBattleId": 17,
  "sourceBattleId": 16,
  "attackType": "skill",
  "effects": []
}
```

#### 9.4. Tentar Aplicar Burning (deve falhar)

```http
POST /api/battle-status/add
Content-Type: application/json

{
  "battleCharacterId": 17,
  "effectType": "Burning",
  "ammount": 10,
  "remainingTurns": 5
}
```

### 10. Teste de Logs de Batalha

#### 10.1. Verificar Logs de Imunidade

```http
GET /api/battle/1/logs
```

Procure por eventos do tipo "STATUS_IMMUNE" no JSON de resposta.

### 11. Teste de Performance

#### 11.1. Criar Personagem com Muitas Resistências

```http
POST /api/battle/characters
Content-Type: application/json

{
  "battleId": 1,
  "externalId": "resistant-tank",
  "characterName": "Super Resistant Tank",
  "characterType": "enemy",
  "isEnemy": true,
  "healthPoints": 5000,
  "maxHealthPoints": 5000
}
```

Suponha que o ID seja `18`.

#### 11.2. Adicionar 10 Resistências Diferentes

Repita para cada elemento:
```http
POST /api/battle/characters/18/resistances
Content-Type: application/json

{
  "element": "Fire",
  "resistanceType": "resist",
  "multiplier": 0.5
}
```

Elementos: Fire, Ice, Lightning, Water, Earth, Wind, Light, Dark, Physical, Psychic

#### 11.3. Adicionar 10 Imunidades a Status

Repita para cada status:
```http
POST /api/battle/characters/18/immunities
Content-Type: application/json

{
  "statusType": "Burning",
  "immunityType": "immune"
}
```

Status: Burning, Frozen, Stunned, Poisoned, Confused, Weakened, Slowed, Silenced, Bleeding, Cursed

#### 11.4. Testar Performance de Consulta

```http
GET /api/battle/characters/18/resistances
GET /api/battle/characters/18/immunities
```

Medir o tempo de resposta.

## Testes Unitários (JUnit)

### ImmunityServiceTest.kt

```kotlin
@SpringBootTest
class ImmunityServiceTest {

    @Autowired
    private lateinit var immunityService: ImmunityService

    @Autowired
    private lateinit var statusImmunityRepository: StatusImmunityRepository

    @Test
    fun `should block status when character is immune`() {
        // Arrange
        val battleCharacterId = 1
        immunityService.addImmunity(battleCharacterId, "Burning", "immune")

        // Act
        val canApply = immunityService.canApplyStatus(battleCharacterId, "Burning")

        // Assert
        assertFalse(canApply)
    }

    @Test
    fun `should allow status when character has no immunity`() {
        // Arrange
        val battleCharacterId = 2

        // Act
        val canApply = immunityService.canApplyStatus(battleCharacterId, "Burning")

        // Assert
        assertTrue(canApply)
    }

    @Test
    fun `should resist status based on chance`() {
        // Arrange
        val battleCharacterId = 3
        immunityService.addImmunity(battleCharacterId, "Frozen", "resist", 100)

        // Act
        val canApply = immunityService.canApplyStatus(battleCharacterId, "Frozen")

        // Assert
        assertFalse(canApply) // 100% resist chance should always block
    }

    @Test
    fun `should remove immunity correctly`() {
        // Arrange
        val battleCharacterId = 4
        immunityService.addImmunity(battleCharacterId, "Stunned", "immune")

        // Act
        immunityService.removeImmunity(battleCharacterId, "Stunned")
        val canApply = immunityService.canApplyStatus(battleCharacterId, "Stunned")

        // Assert
        assertTrue(canApply)
    }
}
```

### ElementResistanceServiceTest.kt

```kotlin
@SpringBootTest
class ElementResistanceServiceTest {

    @Autowired
    private lateinit var elementResistanceService: ElementResistanceService

    @Test
    fun `should reduce damage by 50% when resistant`() {
        // Arrange
        val battleCharacterId = 5
        elementResistanceService.addResistance(battleCharacterId, "Fire", "resist", 0.5)

        // Act
        val damage = elementResistanceService.calculateElementalDamage(battleCharacterId, 100, "Fire")

        // Assert
        assertEquals(50, damage)
    }

    @Test
    fun `should deal 0 damage when immune`() {
        // Arrange
        val battleCharacterId = 6
        elementResistanceService.addResistance(battleCharacterId, "Ice", "immune", 0.0)

        // Act
        val damage = elementResistanceService.calculateElementalDamage(battleCharacterId, 100, "Ice")

        // Assert
        assertEquals(0, damage)
    }

    @Test
    fun `should increase damage by 50% when weak`() {
        // Arrange
        val battleCharacterId = 7
        elementResistanceService.addResistance(battleCharacterId, "Lightning", "weak", 1.5)

        // Act
        val damage = elementResistanceService.calculateElementalDamage(battleCharacterId, 100, "Lightning")

        // Assert
        assertEquals(150, damage)
    }

    @Test
    fun `should return base damage when no resistance exists`() {
        // Arrange
        val battleCharacterId = 8

        // Act
        val damage = elementResistanceService.calculateElementalDamage(battleCharacterId, 100, "Fire")

        // Assert
        assertEquals(100, damage)
    }

    @Test
    fun `should update resistance when adding same element twice`() {
        // Arrange
        val battleCharacterId = 9
        elementResistanceService.addResistance(battleCharacterId, "Fire", "resist", 0.5)

        // Act
        elementResistanceService.addResistance(battleCharacterId, "Fire", "resist", 0.25)
        val damage = elementResistanceService.calculateElementalDamage(battleCharacterId, 100, "Fire")

        // Assert
        assertEquals(25, damage)
    }
}
```

## Checklist de Testes

- [ ] Imunidade completa bloqueia status
- [ ] Resistência por chance funciona corretamente
- [ ] Imunidades podem ser removidas
- [ ] Múltiplas imunidades funcionam
- [ ] Resistência elemental reduz dano corretamente
- [ ] Imunidade elemental zera dano
- [ ] Fraqueza elemental aumenta dano
- [ ] Ataques sem elemento não são afetados por resistências
- [ ] Resistências podem ser atualizadas
- [ ] Resistências podem ser removidas
- [ ] Sistema funciona com damage modifiers
- [ ] Logs de batalha são criados corretamente
- [ ] Performance com muitas resistências é aceitável
- [ ] Cascade delete funciona (quando personagem é deletado)
- [ ] Validações de entrada funcionam (valores negativos, etc.)

## Resultados Esperados

Todos os testes devem passar sem erros. O sistema deve:

1. Bloquear completamente status quando personagem é imune
2. Usar probabilidade correta para resistências
3. Aplicar multiplicadores de dano corretamente
4. Lidar com casos extremos (0 dano, dano negativo)
5. Funcionar em combinação com outros sistemas (damage modifiers)
6. Manter performance aceitável mesmo com muitas resistências
7. Gerar logs apropriados para debugging
