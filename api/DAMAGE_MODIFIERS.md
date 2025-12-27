# Sistema de Modificadores Passivos de Dano

## Visão Geral

O sistema de modificadores passivos de dano permite adicionar bônus de dano permanentes ou condicionais a personagens em batalha. Os modificadores podem ser multiplicadores ou bônus fixos, e podem ter condições específicas para ativação.

## Estrutura da Tabela

```sql
CREATE TABLE damage_modifier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_character_id INTEGER NOT NULL,
    modifier_type TEXT NOT NULL,
    multiplier REAL NOT NULL,
    flat_bonus INTEGER NOT NULL DEFAULT 0,
    condition_type TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id)
);
```

## Tipos de Modificadores (modifier_type)

- **`base-attack`**: Aplica-se apenas a ataques básicos
- **`counter`**: Aplica-se apenas a contra-ataques
- **`free-aim`**: Aplica-se apenas a tiros livres (free shots)
- **`skill`**: Aplica-se apenas a habilidades
- **`first-hit`**: Aplica-se apenas ao primeiro acerto
- **`all`**: Aplica-se a todos os tipos de ataque

## Tipos de Condições (condition_type)

- **`solo`**: Personagem está lutando sozinho (sem aliados)
- **`full-hp`**: Personagem está com HP cheio
- **`low-hp`**: Personagem está com HP baixo (< 30%)
- **`enemy-burning`**: Alvo tem status Burning
- **`enemy-marked`**: Alvo tem status Marked
- **`enemy-fragile`**: Alvo tem status Fragile
- **`has-charges`**: Personagem tem pontos de carga
- **`max-charges`**: Personagem tem carga máxima
- **`twilight-active`**: Personagem tem status Twilight
- **`NULL`**: Sem condição (sempre ativo)

## API Endpoints

### 1. Listar Todos os Modificadores
```http
GET /api/battle/characters/{battleCharacterId}/modifiers
```

Retorna todos os modificadores (ativos e inativos) de um personagem.

### 2. Listar Modificadores Ativos
```http
GET /api/battle/characters/{battleCharacterId}/modifiers/active
```

Retorna apenas os modificadores ativos.

### 3. Adicionar Modificador
```http
POST /api/battle/characters/{battleCharacterId}/modifiers
Content-Type: application/json

{
  "modifierType": "base-attack",
  "multiplier": 1.5,
  "flatBonus": 0,
  "conditionType": null
}
```

### 4. Remover Modificador
```http
DELETE /api/battle/characters/modifiers/{modifierId}
```

### 5. Ativar Modificador
```http
PATCH /api/battle/characters/modifiers/{modifierId}/activate
```

### 6. Desativar Modificador
```http
PATCH /api/battle/characters/modifiers/{modifierId}/deactivate
```

## Como Funciona o Cálculo

O cálculo de dano modificado segue esta ordem:

1. **Filtragem por Tipo**: Apenas modificadores que se aplicam ao tipo de ataque são considerados
2. **Avaliação de Condições**: Verifica se as condições dos modificadores são atendidas
3. **Aplicação de Multiplicadores**: Todos os multiplicadores são aplicados de forma multiplicativa
4. **Aplicação de Bônus Fixos**: Todos os bônus fixos são somados ao final

### Exemplo de Cálculo

```kotlin
// Dano base: 100
// Modificador 1: 1.5x (base-attack)
// Modificador 2: 1.2x (all)
// Modificador 3: +15 flat bonus

// Cálculo:
// 1. Aplica multiplicadores: 100 * 1.5 * 1.2 = 180
// 2. Adiciona bônus fixos: 180 + 15 = 195
// Dano final: 195
```

## Integração com AttackController

O sistema é integrado automaticamente no `AttackController` durante o processamento de dano. O contexto fornecido inclui:

- `targetBattleCharacterId`: ID do alvo
- `isFirstHit`: Se é o primeiro acerto
- `isSolo`: Se o personagem está sozinho

## Exemplos de Uso

### Exemplo 1: Bônus de Dano em Ataques Básicos (+50%)
```json
{
  "modifierType": "base-attack",
  "multiplier": 1.5,
  "flatBonus": 0,
  "conditionType": null
}
```

### Exemplo 2: Bônus de Dano em Inimigos Queimando (+30%)
```json
{
  "modifierType": "all",
  "multiplier": 1.3,
  "flatBonus": 0,
  "conditionType": "enemy-burning"
}
```

### Exemplo 3: Bônus Fixo de Dano (+20)
```json
{
  "modifierType": "all",
  "multiplier": 1.0,
  "flatBonus": 20,
  "conditionType": null
}
```

### Exemplo 4: Dano Extra com HP Cheio (+40%)
```json
{
  "modifierType": "all",
  "multiplier": 1.4,
  "flatBonus": 0,
  "conditionType": "full-hp"
}
```

### Exemplo 5: Primeiro Acerto Devastador (+50 dano)
```json
{
  "modifierType": "first-hit",
  "multiplier": 1.0,
  "flatBonus": 50,
  "conditionType": null
}
```

## Notas Importantes

1. **Múltiplos Modificadores**: Um personagem pode ter múltiplos modificadores ativos simultaneamente
2. **Empilhamento Multiplicativo**: Multiplicadores são aplicados multiplicativamente (1.5x * 1.3x = 1.95x)
3. **Bônus Aditivos**: Bônus fixos são somados (10 + 15 + 20 = 45)
4. **Prioridade**: Multiplicadores são aplicados antes dos bônus fixos
5. **Dano Mínimo**: O dano final nunca pode ser menor que 0

## Service Methods

O `DamageModifierService` fornece os seguintes métodos:

```kotlin
// Calcular dano modificado
fun calculateModifiedDamage(
    battleCharacterId: Int,
    baseDamage: Int,
    attackType: String,
    context: Map<String, Any>
): Int

// Adicionar modificador
fun addModifier(
    battleCharacterId: Int,
    type: String,
    multiplier: Double,
    flatBonus: Int = 0,
    condition: String? = null
): DamageModifier

// Remover modificador
fun removeModifier(modifierId: Int)

// Desativar/Ativar modificador
fun deactivateModifier(modifierId: Int)
fun activateModifier(modifierId: Int)

// Obter modificadores
fun getModifiers(battleCharacterId: Int): List<DamageModifier>
fun getActiveModifiers(battleCharacterId: Int): List<DamageModifier>
```

## Migration

O sistema foi adicionado via migration `V9__create_damage_modifier_table.sql`, que cria a tabela e os índices necessários.

## Arquivos Criados

- `src/main/resources/db/migration/V9__create_damage_modifier_table.sql` - Migration
- `src/main/kotlin/com/example/demo/model/DamageModifier.kt` - Entity
- `src/main/kotlin/com/example/demo/repository/DamageModifierRepository.kt` - Repository
- `src/main/kotlin/com/example/demo/service/DamageModifierService.kt` - Service
- `src/main/kotlin/com/example/demo/controller/DamageModifierController.kt` - Controller
- `src/main/resources/test_damage_modifiers.sql` - Script de teste SQL
