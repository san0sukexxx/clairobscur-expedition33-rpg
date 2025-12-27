# Sistema de Proteções e Imunidades - Backend

## Visão Geral

Sistema completo de imunidades a status e resistências elementais implementado no backend do jogo Clair Obscur: Expedition 33.

## Estrutura do Banco de Dados

### Tabela: status_immunity

Armazena imunidades e resistências de personagens a efeitos de status.

```sql
CREATE TABLE status_immunity (
    id SERIAL PRIMARY KEY,
    battle_character_id INT NOT NULL,
    status_type VARCHAR(50) NOT NULL,
    immunity_type VARCHAR(20) NOT NULL,
    resist_chance INT,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);
```

**Campos:**
- `id`: Identificador único
- `battle_character_id`: ID do personagem na batalha
- `status_type`: Tipo do status (ex: 'Burning', 'Frozen', 'Stunned')
- `immunity_type`: Tipo de imunidade ('immune' ou 'resist')
- `resist_chance`: Para 'resist', chance de evitar o status (0-100)

### Tabela: element_resistance

Armazena resistências e fraquezas elementais de personagens.

```sql
CREATE TABLE element_resistance (
    id SERIAL PRIMARY KEY,
    battle_character_id INT NOT NULL,
    element VARCHAR(50) NOT NULL,
    resistance_type VARCHAR(20) NOT NULL,
    damage_multiplier DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);
```

**Campos:**
- `id`: Identificador único
- `battle_character_id`: ID do personagem na batalha
- `element`: Tipo do elemento (ex: 'Physical', 'Fire', 'Ice', 'Lightning')
- `resistance_type`: Tipo de resistência ('immune', 'resist', 'weak')
- `damage_multiplier`: Multiplicador de dano (0.0 para immune, 0.5 para resist, 1.5 para weak)

## Entities

### StatusImmunity.kt
```kotlin
@Entity
@Table(name = "status_immunity")
data class StatusImmunity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
    @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
    @Column(name = "status_type", nullable = false) val statusType: String,
    @Column(name = "immunity_type", nullable = false) val immunityType: String,
    @Column(name = "resist_chance") val resistChance: Int? = null
)
```

### ElementResistance.kt
```kotlin
@Entity
@Table(name = "element_resistance")
data class ElementResistance(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Int? = null,
    @Column(name = "battle_character_id", nullable = false) val battleCharacterId: Int,
    @Column(name = "element", nullable = false) val element: String,
    @Column(name = "resistance_type", nullable = false) val resistanceType: String,
    @Column(name = "damage_multiplier", nullable = false) val damageMultiplier: BigDecimal
)
```

## Services

### ImmunityService

Gerencia imunidades e resistências a status.

**Métodos principais:**

- `canApplyStatus(battleCharacterId: Int, statusType: String): Boolean`
  - Verifica se um status pode ser aplicado ao personagem
  - Retorna false se o personagem é imune ou resiste com sucesso
  - Para resistências, usa um sistema baseado em chance aleatória

- `addImmunity(battleCharacterId: Int, statusType: String, immunityType: String, resistChance: Int?)`
  - Adiciona uma imunidade ou resistência ao personagem
  - immunityType: 'immune' (bloqueio total) ou 'resist' (baseado em chance)
  - resistChance: 0-100 para tipo 'resist'

- `removeImmunity(battleCharacterId: Int, statusType: String)`
  - Remove todas as imunidades de um tipo específico de status

- `getImmunities(battleCharacterId: Int): List<StatusImmunity>`
  - Retorna todas as imunidades do personagem

### ElementResistanceService

Gerencia resistências e fraquezas elementais.

**Métodos principais:**

- `calculateElementalDamage(battleCharacterId: Int, baseDamage: Int, element: String): Int`
  - Calcula o dano final após aplicar resistências elementais
  - Retorna 0 se o personagem é imune ao elemento
  - Aplica o multiplicador de dano conforme a resistência/fraqueza

- `addResistance(battleCharacterId: Int, element: String, resistanceType: String, multiplier: Double)`
  - Adiciona ou atualiza uma resistência elemental
  - resistanceType: 'immune', 'resist', 'weak'
  - multiplier: 0.0 (immune), 0.5 (resist 50%), 1.5 (weak 50%), etc.

- `removeResistance(battleCharacterId: Int, element: String)`
  - Remove a resistência a um elemento específico

- `getResistances(battleCharacterId: Int): List<ElementResistance>`
  - Retorna todas as resistências elementais do personagem

- `getDamageMultiplier(battleCharacterId: Int, element: String): Double`
  - Retorna o multiplicador de dano para um elemento (1.0 se não houver resistência)

## Integrações

### BattleStatusController

Modificado para verificar imunidades antes de aplicar status:

```kotlin
@PostMapping("/add")
fun addStatus(@RequestBody body: AddStatusRequest): ResponseEntity<Void> {
    // Verifica imunidade
    if (!immunityService.canApplyStatus(bc.id!!, body.effectType)) {
        // Loga evento de imunidade e retorna
        battleLogRepository.save(
            BattleLog(battleId = battleId, eventType = "STATUS_IMMUNE", eventJson = eventJson)
        )
        return ResponseEntity.noContent().build()
    }

    // Aplica status normalmente se não for imune
    // ...
}
```

### AttackController

Modificado para aplicar resistências elementais ao dano:

```kotlin
@PostMapping
fun addAttack(@RequestBody body: CreateAttackRequest): ResponseEntity<Void> {
    // Calcula dano com modificadores
    var modifiedDamage = damageModifierService.calculateModifiedDamage(...)

    // Aplica resistências elementais
    if (body.element != null) {
        modifiedDamage = elementResistanceService.calculateElementalDamage(
            battleCharacterId = targetBC.id!!,
            baseDamage = modifiedDamage,
            element = body.element
        )
    }

    // Aplica dano final
    damageService.applyDamage(targetBC, modifiedDamage)
}
```

### CreateAttackRequest

Adicionado campo `element` para especificar o tipo elemental do ataque:

```kotlin
data class CreateAttackRequest(
    // ... campos existentes ...
    val element: String? = null  // 'Physical', 'Fire', 'Ice', 'Lightning', etc.
)
```

## API Endpoints

### Gerenciamento de Imunidades

#### Adicionar Imunidade
```
POST /api/battle/characters/{id}/immunities
Content-Type: application/json

{
  "statusType": "Burning",
  "immunityType": "immune",
  "resistChance": null
}
```

#### Adicionar Resistência
```
POST /api/battle/characters/{id}/immunities
Content-Type: application/json

{
  "statusType": "Frozen",
  "immunityType": "resist",
  "resistChance": 50
}
```

#### Listar Imunidades
```
GET /api/battle/characters/{id}/immunities

Response: 200 OK
[
  {
    "id": 1,
    "battleCharacterId": 5,
    "statusType": "Burning",
    "immunityType": "immune",
    "resistChance": null
  },
  {
    "id": 2,
    "battleCharacterId": 5,
    "statusType": "Frozen",
    "immunityType": "resist",
    "resistChance": 50
  }
]
```

#### Remover Imunidade
```
DELETE /api/battle/characters/{id}/immunities/{statusType}

Exemplo:
DELETE /api/battle/characters/5/immunities/Burning
```

### Gerenciamento de Resistências Elementais

#### Adicionar/Atualizar Resistência
```
POST /api/battle/characters/{id}/resistances
Content-Type: application/json

{
  "element": "Fire",
  "resistanceType": "resist",
  "multiplier": 0.5
}
```

#### Adicionar Imunidade Elemental
```
POST /api/battle/characters/{id}/resistances
Content-Type: application/json

{
  "element": "Ice",
  "resistanceType": "immune",
  "multiplier": 0.0
}
```

#### Adicionar Fraqueza Elemental
```
POST /api/battle/characters/{id}/resistances
Content-Type: application/json

{
  "element": "Lightning",
  "resistanceType": "weak",
  "multiplier": 1.5
}
```

#### Listar Resistências
```
GET /api/battle/characters/{id}/resistances

Response: 200 OK
[
  {
    "id": 1,
    "battleCharacterId": 5,
    "element": "Fire",
    "resistanceType": "resist",
    "damageMultiplier": 0.50
  },
  {
    "id": 2,
    "battleCharacterId": 5,
    "element": "Ice",
    "resistanceType": "immune",
    "damageMultiplier": 0.00
  },
  {
    "id": 3,
    "battleCharacterId": 5,
    "element": "Lightning",
    "resistanceType": "weak",
    "damageMultiplier": 1.50
  }
]
```

#### Remover Resistência
```
DELETE /api/battle/characters/{id}/resistances/{element}

Exemplo:
DELETE /api/battle/characters/5/resistances/Fire
```

## Exemplos de Uso

### Exemplo 1: Boss Imune a Queimadura

```bash
# Criar boss com imunidade a Burning
POST /api/battle/characters/10/immunities
{
  "statusType": "Burning",
  "immunityType": "immune"
}

# Tentar aplicar Burning no boss (será bloqueado)
POST /api/battle-status/add
{
  "battleCharacterId": 10,
  "effectType": "Burning",
  "ammount": 5,
  "remainingTurns": 3
}
# Resultado: Status não será aplicado, evento "STATUS_IMMUNE" será logado
```

### Exemplo 2: Inimigo com 50% de Resistência a Congelamento

```bash
# Adicionar resistência a Frozen
POST /api/battle/characters/11/immunities
{
  "statusType": "Frozen",
  "immunityType": "resist",
  "resistChance": 50
}

# Tentar aplicar Frozen (50% de chance de falhar)
POST /api/battle-status/add
{
  "battleCharacterId": 11,
  "effectType": "Frozen",
  "ammount": 10,
  "remainingTurns": 2
}
# Resultado: 50% de chance do status ser aplicado
```

### Exemplo 3: Inimigo Resistente a Fogo e Fraco a Gelo

```bash
# Adicionar resistência a Fire (50% de dano)
POST /api/battle/characters/12/resistances
{
  "element": "Fire",
  "resistanceType": "resist",
  "multiplier": 0.5
}

# Adicionar fraqueza a Ice (150% de dano)
POST /api/battle/characters/12/resistances
{
  "element": "Ice",
  "resistanceType": "weak",
  "multiplier": 1.5
}

# Atacar com Fire (100 de dano base)
POST /api/attacks
{
  "totalDamage": 100,
  "element": "Fire",
  "targetBattleId": 12,
  "sourceBattleId": 5,
  "attackType": "skill"
}
# Resultado: 50 de dano aplicado

# Atacar com Ice (100 de dano base)
POST /api/attacks
{
  "totalDamage": 100,
  "element": "Ice",
  "targetBattleId": 12,
  "sourceBattleId": 5,
  "attackType": "skill"
}
# Resultado: 150 de dano aplicado
```

### Exemplo 4: Golem Imune a Físico

```bash
# Criar Golem imune a dano Physical
POST /api/battle/characters/13/resistances
{
  "element": "Physical",
  "resistanceType": "immune",
  "multiplier": 0.0
}

# Atacar com dano Physical
POST /api/attacks
{
  "totalDamage": 200,
  "element": "Physical",
  "targetBattleId": 13,
  "sourceBattleId": 5,
  "attackType": "basic"
}
# Resultado: 0 de dano aplicado (imune)
```

## Tipos de Status Suportados

- Burning (Queimadura)
- Frozen (Congelamento)
- Stunned (Atordoado)
- Poisoned (Envenenado)
- Confused (Confuso)
- Weakened (Enfraquecido)
- Slowed (Lento)
- Silenced (Silenciado)
- Bleeding (Sangrando)
- Cursed (Amaldiçoado)
- E todos os outros status do jogo

## Tipos de Elementos Suportados

- Physical (Físico)
- Fire (Fogo)
- Ice (Gelo)
- Lightning (Raio)
- Water (Água)
- Earth (Terra)
- Wind (Vento)
- Light (Luz)
- Dark (Trevas)
- E outros elementos customizados

## Logs de Batalha

O sistema gera eventos de log para rastreamento:

### STATUS_IMMUNE
Gerado quando um personagem é imune ou resiste a um status:
```json
{
  "battleCharacterId": 10,
  "characterName": "Fire Golem",
  "statusType": "Burning",
  "result": "immune_or_resisted"
}
```

## Considerações de Performance

1. **Índices**: Criados índices nas tabelas para otimizar consultas:
   - `idx_status_immunity_battle_character`
   - `idx_status_immunity_status_type`
   - `idx_element_resistance_battle_character`
   - `idx_element_resistance_element`

2. **Cache**: O sistema não usa cache atualmente, mas pode ser adicionado se necessário para melhorar performance em personagens com muitas resistências.

3. **Validações**:
   - `resistChance` deve estar entre 0 e 100
   - `damageMultiplier` deve ser >= 0.0
   - Elementos e status types são validados na camada de aplicação

## Testes Sugeridos

1. **Teste de Imunidade Completa**: Verificar que status não é aplicado quando personagem é imune
2. **Teste de Resistência por Chance**: Verificar que sistema de probabilidade funciona corretamente
3. **Teste de Resistência Elemental**: Verificar que multiplicadores são aplicados corretamente
4. **Teste de Imunidade Elemental**: Verificar que dano é zerado quando personagem é imune
5. **Teste de Fraqueza Elemental**: Verificar que dano é aumentado quando personagem é fraco
6. **Teste de Combinação**: Verificar interação entre damage modifiers e elemental resistances
7. **Teste de Remoção**: Verificar que imunidades/resistências são removidas corretamente
8. **Teste de Atualização**: Verificar que resistências podem ser atualizadas
9. **Teste de Cascade Delete**: Verificar que imunidades/resistências são removidas quando personagem é deletado

## Arquivos Criados/Modificados

### Novos Arquivos:
- `/api/src/main/resources/db/migration/V11__create_immunity_and_resistance_tables.sql`
- `/api/src/main/kotlin/com/example/demo/model/StatusImmunity.kt`
- `/api/src/main/kotlin/com/example/demo/model/ElementResistance.kt`
- `/api/src/main/kotlin/com/example/demo/repository/StatusImmunityRepository.kt`
- `/api/src/main/kotlin/com/example/demo/repository/ElementResistanceRepository.kt`
- `/api/src/main/kotlin/com/example/demo/service/ImmunityService.kt`
- `/api/src/main/kotlin/com/example/demo/service/ElementResistanceService.kt`
- `/api/src/main/kotlin/com/example/demo/controller/ImmunityController.kt`
- `/api/src/main/kotlin/com/example/demo/controller/ElementResistanceController.kt`
- `/api/src/main/kotlin/com/example/demo/dto/AddImmunityRequest.kt`
- `/api/src/main/kotlin/com/example/demo/dto/AddResistanceRequest.kt`

### Arquivos Modificados:
- `/api/src/main/kotlin/com/example/demo/controller/BattleStatusController.kt`
- `/api/src/main/kotlin/com/example/demo/controller/AttackController.kt`
- `/api/src/main/kotlin/com/example/demo/dto/CreateAttackRequest.kt`

## Próximos Passos

1. Testar compilação e execução do projeto
2. Executar migrations no banco de dados
3. Testar endpoints via Postman/Insomnia
4. Integrar com frontend
5. Adicionar validações adicionais se necessário
6. Considerar adicionar cache para melhor performance
7. Implementar testes unitários e de integração
