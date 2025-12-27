# Sistema de Tracking de Efeitos Picto

Sistema para rastrear efeitos "once per battle" e "once per turn" em batalhas.

## Estrutura

### Tabela: `picto_effect_tracker`

```sql
CREATE TABLE IF NOT EXISTS picto_effect_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id INTEGER NOT NULL,
    battle_character_id INTEGER NOT NULL,
    picto_name TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    times_triggered INTEGER NOT NULL DEFAULT 0,
    last_turn_triggered INTEGER,
    reset_on_turn_end BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character (id) ON DELETE CASCADE
);
```

### Tipos de Efeito

- **`once-per-battle`**: Pode ser ativado apenas uma vez durante toda a batalha
- **`once-per-turn`**: Pode ser ativado uma vez por turno do personagem
- **`counter`**: Contador que incrementa indefinidamente (para tracking geral)

## API Endpoints

### 1. Registrar Ativação de Efeito

**POST** `/api/battle/picto-effects/track`

Registra que um efeito foi ativado. Verifica automaticamente se o efeito pode ser ativado baseado no tipo.

**Request Body:**
```json
{
  "battleId": 1,
  "battleCharacterId": 5,
  "pictoName": "FireStrike",
  "effectType": "once-per-battle"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "battleId": 1,
  "battleCharacterId": 5,
  "pictoName": "FireStrike",
  "effectType": "once-per-battle",
  "timesTriggered": 1,
  "lastTurnTriggered": 3,
  "resetOnTurnEnd": false
}
```

**Response:** `400 Bad Request` - Se o efeito não pode ser ativado

---

### 2. Verificar se Efeito Pode Ser Ativado

**GET** `/api/battle/picto-effects/check/{battleCharacterId}/{pictoName}?battleId={battleId}&effectType={effectType}`

Verifica se um efeito pode ser ativado sem registrá-lo.

**Exemplo:**
```
GET /api/battle/picto-effects/check/5/FireStrike?battleId=1&effectType=once-per-battle
```

**Response:** `200 OK`
```json
{
  "canActivate": false,
  "timesTriggered": 1,
  "lastTurnTriggered": 3
}
```

---

### 3. Resetar Efeitos "Once Per Turn"

**POST** `/api/battle/picto-effects/reset-turn/{battleId}`

Reseta todos os efeitos "once per turn" no fim do turno.

**Request Body (Opcional):**
```json
{
  "battleCharacterId": 5
}
```

- Se `battleCharacterId` for fornecido: reseta apenas efeitos desse personagem
- Se não for fornecido: reseta todos os efeitos da batalha

**Response:** `204 No Content`

---

### 4. Listar Trackers de uma Batalha

**GET** `/api/battle/picto-effects/battle/{battleId}`

Lista todos os trackers ativos de uma batalha.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "battleId": 1,
    "battleCharacterId": 5,
    "pictoName": "FireStrike",
    "effectType": "once-per-battle",
    "timesTriggered": 1,
    "lastTurnTriggered": 3,
    "resetOnTurnEnd": false
  },
  {
    "id": 2,
    "battleId": 1,
    "battleCharacterId": 5,
    "pictoName": "QuickAttack",
    "effectType": "once-per-turn",
    "timesTriggered": 2,
    "lastTurnTriggered": 5,
    "resetOnTurnEnd": true
  }
]
```

---

### 5. Listar Trackers de um Personagem

**GET** `/api/battle/picto-effects/character/{battleCharacterId}`

Lista todos os trackers de um personagem específico.

**Response:** `200 OK` (mesmo formato do endpoint anterior)

---

### 6. Obter Tracker Específico

**GET** `/api/battle/picto-effects/tracker/{battleId}/{battleCharacterId}/{pictoName}`

Obtém informações de um tracker específico.

**Exemplo:**
```
GET /api/battle/picto-effects/tracker/1/5/FireStrike
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "battleId": 1,
  "battleCharacterId": 5,
  "pictoName": "FireStrike",
  "effectType": "once-per-battle",
  "timesTriggered": 1,
  "lastTurnTriggered": 3,
  "resetOnTurnEnd": false
}
```

**Response:** `404 Not Found` - Se o tracker não existir

---

### 7. Limpar Trackers de uma Batalha

**DELETE** `/api/battle/picto-effects/clear/{battleId}`

Remove todos os trackers de uma batalha (útil quando a batalha termina).

**Response:** `204 No Content`

---

## Fluxo de Uso

### Exemplo 1: Efeito "Once Per Battle"

```javascript
// Antes de usar o picto
const check = await fetch(
  '/api/battle/picto-effects/check/5/UltimateAbility?battleId=1&effectType=once-per-battle'
);
const { canActivate } = await check.json();

if (canActivate) {
  // Executar efeito do picto
  executeUltimateAbility();

  // Registrar uso
  await fetch('/api/battle/picto-effects/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      battleId: 1,
      battleCharacterId: 5,
      pictoName: 'UltimateAbility',
      effectType: 'once-per-battle'
    })
  });
} else {
  showMessage('Esta habilidade já foi usada nesta batalha!');
}
```

### Exemplo 2: Efeito "Once Per Turn"

```javascript
// Antes de usar o picto
const check = await fetch(
  '/api/battle/picto-effects/check/5/QuickDraw?battleId=1&effectType=once-per-turn'
);
const { canActivate } = await check.json();

if (canActivate) {
  // Executar efeito do picto
  executeQuickDraw();

  // Registrar uso
  await fetch('/api/battle/picto-effects/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      battleId: 1,
      battleCharacterId: 5,
      pictoName: 'QuickDraw',
      effectType: 'once-per-turn'
    })
  });
} else {
  showMessage('Esta habilidade já foi usada neste turno!');
}
```

### Exemplo 3: Resetar Efeitos no Fim do Turno

```javascript
// Quando o turno do personagem terminar
await fetch('/api/battle/picto-effects/reset-turn/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    battleCharacterId: 5
  })
});
```

### Exemplo 4: Limpar ao Fim da Batalha

```javascript
// Quando a batalha terminar
await fetch('/api/battle/picto-effects/clear/1', {
  method: 'DELETE'
});
```

---

## Integração com Sistema de Turnos

Para integração automática com o sistema de turnos, você pode chamar o reset automaticamente quando um turno terminar:

```kotlin
// Em BattleTurnService ou similar
@Transactional
fun endTurn(battleId: Int, battleCharacterId: Int) {
    // ... lógica existente de fim de turno ...

    // Resetar efeitos once-per-turn
    pictoEffectTrackerService.resetTurn(battleId, battleCharacterId)
}
```

---

## Logging

Todas as operações geram entradas na tabela `battle_log`:

- `PICTO_EFFECT_TRACKED`: Quando um efeito é registrado
- `PICTO_EFFECTS_RESET`: Quando efeitos são resetados
- `PICTO_EFFECTS_CLEARED`: Quando todos os trackers são removidos

---

## Considerações

1. **Cálculo de Turnos**: O sistema calcula o turno atual baseado na `play_order` da tabela `battle_turn`. Cada rodada completa incrementa o turno.

2. **Resetar vs Deletar**: Efeitos "once-per-turn" são deletados ao fim do turno para simplificar. Eles serão recriados quando ativados novamente.

3. **Validação**: O endpoint `/track` valida automaticamente se o efeito pode ser ativado antes de registrar. Se não puder, retorna `400 Bad Request`.

4. **Cascade Delete**: Quando uma batalha ou personagem é deletado, todos os seus trackers são automaticamente removidos (CASCADE).

5. **Tipos Personalizados**: Você pode adicionar novos tipos de efeito além de "once-per-battle" e "once-per-turn", como "twice-per-battle", "cooldown-3-turns", etc. Basta modificar a lógica em `canActivate()`.
