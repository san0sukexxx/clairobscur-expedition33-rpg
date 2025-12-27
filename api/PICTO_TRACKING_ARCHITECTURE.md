# Arquitetura do Sistema de Tracking de Efeitos Picto

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│  (React/TypeScript - Calls API when picto is used)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                              │
│  PictoEffectTrackerController.kt                                 │
│                                                                   │
│  Endpoints:                                                       │
│  • POST   /api/battle/picto-effects/track                       │
│  • GET    /api/battle/picto-effects/check/{id}/{name}           │
│  • POST   /api/battle/picto-effects/reset-turn/{id}             │
│  • GET    /api/battle/picto-effects/battle/{id}                 │
│  • GET    /api/battle/picto-effects/character/{id}              │
│  • GET    /api/battle/picto-effects/tracker/{ids}               │
│  • DELETE /api/battle/picto-effects/clear/{id}                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Business Logic
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
│  PictoEffectTrackerService.kt                                    │
│                                                                   │
│  Methods:                                                         │
│  • canActivate()      - Validates if effect can be used         │
│  • track()            - Records effect activation               │
│  • resetTurn()        - Resets once-per-turn effects            │
│  • getTracker()       - Gets specific tracker                   │
│  • listTrackers...()  - Lists trackers by battle/character      │
│  • clearBattle()      - Removes all trackers                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Data Access
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                               │
│  PictoEffectTrackerRepository.kt (JPA)                           │
│                                                                   │
│  Methods:                                                         │
│  • findByBattleIdAndBattleCharacterIdAndPictoName()             │
│  • findByBattleId()                                              │
│  • findByBattleCharacterId()                                     │
│  • deleteByBattleId()                                            │
│  • save()                                                        │
│  • delete()                                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ JPA/Hibernate
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ENTITY LAYER                                │
│  PictoEffectTracker.kt                                           │
│                                                                   │
│  Fields:                                                          │
│  • id                   - Primary key                            │
│  • battleId            - FK to battle                            │
│  • battleCharacterId   - FK to battle_character                 │
│  • pictoName           - Name of the picto/ability              │
│  • effectType          - Type: once-per-battle, once-per-turn   │
│  • timesTriggered      - Counter                                │
│  • lastTurnTriggered   - Last turn number                       │
│  • resetOnTurnEnd      - Flag for reset logic                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                   │
│  SQLite (picto_effect_tracker table)                             │
│                                                                   │
│  Relationships:                                                   │
│  • FK: battle_id → battle(id)                                   │
│  • FK: battle_character_id → battle_character(id)               │
│                                                                   │
│  Indexes:                                                         │
│  • PRIMARY KEY on id                                             │
│  • (Optional) INDEX on (battle_id, battle_character_id, picto_name) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### 1. Verificar se Efeito Pode Ser Ativado

```
User clicks picto
       │
       ▼
Frontend calls: GET /check/{id}/{name}?battleId=X&effectType=Y
       │
       ▼
Controller receives request
       │
       ▼
Service.canActivate(battleId, characterId, pictoName, effectType)
       │
       ├─→ Get current turn number
       │
       ├─→ Query tracker from repository
       │
       ├─→ Validate based on effect type:
       │   ├─ once-per-battle: check timesTriggered == 0
       │   ├─ once-per-turn:   check lastTurnTriggered != currentTurn
       │   └─ counter:          always allow
       │
       ▼
Return CanActivateResponse { canActivate: boolean, ... }
       │
       ▼
Frontend enables/disables picto button
```

### 2. Registrar Ativação de Efeito

```
User uses picto (after validation)
       │
       ▼
Frontend calls: POST /track
       │
       ▼
Controller receives TrackEffectRequest
       │
       ├─→ Validate canActivate() first
       │   └─ If false: return 400 Bad Request
       │
       ▼
Service.track(battleId, characterId, pictoName, effectType)
       │
       ├─→ Get current turn number
       │
       ├─→ Query existing tracker OR create new
       │
       ├─→ Update:
       │   ├─ timesTriggered++
       │   ├─ lastTurnTriggered = currentTurn
       │   └─ resetOnTurnEnd = (effectType == "once-per-turn")
       │
       ├─→ Save to database
       │
       ├─→ Log to battle_log (event: PICTO_EFFECT_TRACKED)
       │
       ▼
Return PictoEffectTrackerResponse
       │
       ▼
Frontend shows success message
```

### 3. Resetar Efeitos no Fim do Turno

```
Turn ends (user clicks "End Turn" or automatic)
       │
       ▼
Frontend calls: POST /reset-turn/{battleId}
       │
       ▼
Controller receives request
       │
       ▼
Service.resetTurn(battleId, characterId?)
       │
       ├─→ Query all trackers (by battleId or characterId)
       │
       ├─→ Filter: where resetOnTurnEnd == true
       │
       ├─→ Delete filtered trackers
       │
       ├─→ Log to battle_log (event: PICTO_EFFECTS_RESET)
       │
       ▼
Return 204 No Content
       │
       ▼
Next turn begins (effects are now available again)
```

### 4. Limpar ao Fim da Batalha

```
Battle ends
       │
       ▼
Frontend calls: DELETE /clear/{battleId}
       │
       ▼
Controller receives request
       │
       ▼
Service.clearBattle(battleId)
       │
       ├─→ Delete all trackers where battle_id = battleId
       │
       ├─→ Log to battle_log (event: PICTO_EFFECTS_CLEARED)
       │
       ▼
Return 204 No Content
       │
       ▼
Clean state for next battle
```

---

## Diagrama de Estado - Once Per Battle

```
┌──────────────┐
│   Initial    │ timesTriggered = 0
│   (Unused)   │ canActivate = true
└──────┬───────┘
       │
       │ track()
       │
       ▼
┌──────────────┐
│     Used     │ timesTriggered = 1
│  (Blocked)   │ canActivate = false
└──────┬───────┘
       │
       │ (stays blocked until battle ends)
       │
       ▼
┌──────────────┐
│ Battle Ends  │
│ clearBattle()│ → Tracker deleted
└──────────────┘
```

---

## Diagrama de Estado - Once Per Turn

```
┌──────────────┐
│   Initial    │ lastTurnTriggered = null
│   (Unused)   │ canActivate = true
└──────┬───────┘
       │
       │ track() at turn 1
       │
       ▼
┌──────────────┐
│ Used (Turn 1)│ lastTurnTriggered = 1
│  (Blocked)   │ canActivate = false (for turn 1)
└──────┬───────┘
       │
       │ resetTurn() (end of turn)
       │
       ▼
┌──────────────┐
│   Deleted    │ Tracker removed
└──────┬───────┘
       │
       │ Next turn begins
       │
       ▼
┌──────────────┐
│   Initial    │ Can be used again
│   (Unused)   │ canActivate = true
└──────────────┘
```

---

## Relacionamentos de Banco de Dados

```
┌─────────────────┐         ┌─────────────────────┐
│     battle      │         │  battle_character   │
├─────────────────┤         ├─────────────────────┤
│ id (PK)         │◄───┐    │ id (PK)             │◄───┐
│ campaign_id     │    │    │ battle_id (FK)      │    │
│ battle_status   │    │    │ external_id         │    │
│ ...             │    │    │ character_name      │    │
└─────────────────┘    │    │ ...                 │    │
                       │    └─────────────────────┘    │
                       │                               │
                       │                               │
                       │    ┌──────────────────────────┴──────┐
                       │    │                                  │
                       └────┼──────────────────────────────────┤
                            │   picto_effect_tracker           │
                            ├──────────────────────────────────┤
                            │ id (PK)                          │
                            │ battle_id (FK) ─────────────────►│
                            │ battle_character_id (FK) ────────►│
                            │ picto_name                       │
                            │ effect_type                      │
                            │ times_triggered                  │
                            │ last_turn_triggered              │
                            │ reset_on_turn_end                │
                            └──────────────────────────────────┘
```

---

## Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE BATALHA                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────┐     │
│  │  Battle System   │         │  Picto Effect Tracker   │     │
│  ├──────────────────┤         ├─────────────────────────┤     │
│  │ • Create Battle  │         │ • Track Effects         │     │
│  │ • Manage Turns   │◄───────►│ • Validate Usage        │     │
│  │ • End Battle     │         │ • Reset Cooldowns       │     │
│  └──────────────────┘         └─────────────────────────┘     │
│         │                               │                       │
│         │                               │                       │
│         ▼                               ▼                       │
│  ┌──────────────────┐         ┌─────────────────────────┐     │
│  │  Battle Logs     │         │  Battle Logs            │     │
│  ├──────────────────┤         ├─────────────────────────┤     │
│  │ • BATTLE_CREATED │         │ • PICTO_EFFECT_TRACKED  │     │
│  │ • TURN_STARTED   │         │ • PICTO_EFFECTS_RESET   │     │
│  │ • TURN_ENDED     │         │ • PICTO_EFFECTS_CLEARED │     │
│  │ • BATTLE_ENDED   │         └─────────────────────────┘     │
│  └──────────────────┘                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Dependências

```
PictoEffectTrackerController
        │
        ├─→ PictoEffectTrackerService
        │           │
        │           ├─→ PictoEffectTrackerRepository
        │           │
        │           ├─→ BattleTurnRepository
        │           │
        │           ├─→ BattleCharacterRepository
        │           │
        │           └─→ BattleLogRepository
        │
        ├─→ BattleLogRepository
        │
        └─→ ObjectMapper (for JSON serialization)
```

---

## Padrões de Design Utilizados

### 1. Repository Pattern
- Abstração da camada de dados
- Interface JPA para acesso ao banco

### 2. Service Layer Pattern
- Lógica de negócio isolada
- Reutilizável por múltiplos controllers

### 3. DTO Pattern
- Objetos de transferência específicos
- Separação entre entidades e API

### 4. RESTful API
- Endpoints padronizados
- Verbos HTTP apropriados (GET, POST, DELETE)

### 5. Transaction Management
- `@Transactional` em operações de escrita
- Garantia de consistência

---

## Performance Considerations

### Queries Otimizadas
- Queries específicas por caso de uso
- Evita N+1 problems

### Cascade Operations
- DELETE CASCADE no banco
- Limpeza automática

### Minimal Data Transfer
- DTOs retornam apenas dados necessários
- Paginação não necessária (poucos trackers por batalha)

---

## Segurança

### Validações
- Verificação de existência de battle/character
- Validação de efeito antes de registrar

### Transaction Safety
- Operações atômicas
- Rollback automático em caso de erro

### Logging
- Auditoria completa via battle_log
- Rastreabilidade de todas as ações

---

## Extensibilidade

### Novos Tipos de Efeito
Adicione lógica em `canActivate()`:
```kotlin
when (effectType) {
    "once-per-battle" -> ...
    "once-per-turn" -> ...
    "cooldown-3-turns" -> {
        val currentTurn = getCurrentTurnNumber(battleId)
        val lastTurn = tracker?.lastTurnTriggered ?: 0
        (currentTurn - lastTurn) >= 3
    }
    // ... mais tipos
}
```

### Novas Condições
Adicione parâmetros no tracker:
```kotlin
data class PictoEffectTracker(
    // ... campos existentes ...
    val cooldownTurns: Int? = null,
    val maxCharges: Int? = null,
    val condition: String? = null
)
```

---

## Resumo da Implementação

- **7 arquivos** criados
- **7 endpoints** REST
- **3 tipos** de efeito suportados
- **Full logging** integrado
- **Cascade delete** automático
- **Transaction safe**
- **Documentação completa**
- **Exemplos práticos**
