# Exemplos de Uso do Sistema de Tracking

## Cenários de Teste

### Cenário 1: Habilidade Ultimate (Once Per Battle)

**Contexto:** Um jogador tem uma habilidade ultimate que só pode ser usada uma vez por batalha.

```bash
# 1. Primeira tentativa - deve permitir
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/1/UltimateStrike?battleId=100&effectType=once-per-battle"
# Response: {"canActivate": true, "timesTriggered": 0, "lastTurnTriggered": null}

# 2. Registrar uso
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "UltimateStrike",
    "effectType": "once-per-battle"
  }'
# Response: 200 OK com dados do tracker

# 3. Segunda tentativa - deve bloquear
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/1/UltimateStrike?battleId=100&effectType=once-per-battle"
# Response: {"canActivate": false, "timesTriggered": 1, "lastTurnTriggered": 1}

# 4. Tentar usar novamente - deve falhar
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "UltimateStrike",
    "effectType": "once-per-battle"
  }'
# Response: 400 Bad Request
```

---

### Cenário 2: Habilidade Rápida (Once Per Turn)

**Contexto:** Um jogador tem uma habilidade que pode usar uma vez por turno.

```bash
# Turno 1
# 1. Verificar disponibilidade
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/2/QuickDraw?battleId=100&effectType=once-per-turn"
# Response: {"canActivate": true, "timesTriggered": 0, "lastTurnTriggered": null}

# 2. Usar a habilidade
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 2,
    "pictoName": "QuickDraw",
    "effectType": "once-per-turn"
  }'

# 3. Tentar usar novamente no mesmo turno - deve bloquear
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/2/QuickDraw?battleId=100&effectType=once-per-turn"
# Response: {"canActivate": false, "timesTriggered": 1, "lastTurnTriggered": 1}

# 4. Fim do turno - resetar
curl -X POST http://localhost:8080/api/battle/picto-effects/reset-turn/100 \
  -H "Content-Type: application/json" \
  -d '{"battleCharacterId": 2}'

# Turno 2
# 5. Verificar disponibilidade novamente - deve permitir
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/2/QuickDraw?battleId=100&effectType=once-per-turn"
# Response: {"canActivate": true, "timesTriggered": 0, "lastTurnTriggered": null}
```

---

### Cenário 3: Múltiplos Personagens e Habilidades

```bash
# Personagem A usa Ultimate
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "UltimateStrike",
    "effectType": "once-per-battle"
  }'

# Personagem B usa Quick Draw
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 2,
    "pictoName": "QuickDraw",
    "effectType": "once-per-turn"
  }'

# Personagem A usa Combo Attack (also once-per-turn)
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "ComboAttack",
    "effectType": "once-per-turn"
  }'

# Listar todos os trackers da batalha
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100
# Response: Array com 3 trackers

# Listar trackers do Personagem A
curl -X GET http://localhost:8080/api/battle/picto-effects/character/1
# Response: Array com 2 trackers (UltimateStrike e ComboAttack)
```

---

### Cenário 4: Fim de Turno e Reset

```bash
# Estado inicial: vários personagens usaram habilidades once-per-turn

# Reset apenas do Personagem 1 (seu turno terminou)
curl -X POST http://localhost:8080/api/battle/picto-effects/reset-turn/100 \
  -H "Content-Type: application/json" \
  -d '{"battleCharacterId": 1}'

# Listar trackers do Personagem 1 - once-per-turn foram removidos
curl -X GET http://localhost:8080/api/battle/picto-effects/character/1
# Response: Array com apenas once-per-battle

# Reset de toda a batalha (fim de rodada)
curl -X POST http://localhost:8080/api/battle/picto-effects/reset-turn/100 \
  -H "Content-Type: application/json"
# Isso remove todos os once-per-turn de todos os personagens
```

---

### Cenário 5: Fim de Batalha

```bash
# Verificar todos os trackers ativos
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100

# Limpar todos os trackers da batalha
curl -X DELETE http://localhost:8080/api/battle/picto-effects/clear/100

# Verificar novamente - deve estar vazio
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100
# Response: []
```

---

### Cenário 6: Obter Informações de um Tracker Específico

```bash
# Obter informações detalhadas de um tracker específico
curl -X GET http://localhost:8080/api/battle/picto-effects/tracker/100/1/UltimateStrike
# Response: Dados completos do tracker

# Tentar obter tracker que não existe
curl -X GET http://localhost:8080/api/battle/picto-effects/tracker/100/1/NonExistent
# Response: 404 Not Found
```

---

## Integração com Frontend

### React/TypeScript Example

```typescript
interface PictoEffectTracker {
  id: number;
  battleId: number;
  battleCharacterId: number;
  pictoName: string;
  effectType: string;
  timesTriggered: number;
  lastTurnTriggered: number | null;
  resetOnTurnEnd: boolean;
}

interface CanActivateResponse {
  canActivate: boolean;
  timesTriggered: number;
  lastTurnTriggered: number | null;
}

class PictoEffectService {
  private baseUrl = '/api/battle/picto-effects';

  async canActivate(
    battleCharacterId: number,
    pictoName: string,
    battleId: number,
    effectType: 'once-per-battle' | 'once-per-turn'
  ): Promise<CanActivateResponse> {
    const response = await fetch(
      `${this.baseUrl}/check/${battleCharacterId}/${pictoName}?battleId=${battleId}&effectType=${effectType}`
    );
    return response.json();
  }

  async track(
    battleId: number,
    battleCharacterId: number,
    pictoName: string,
    effectType: 'once-per-battle' | 'once-per-turn'
  ): Promise<PictoEffectTracker> {
    const response = await fetch(`${this.baseUrl}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battleId,
        battleCharacterId,
        pictoName,
        effectType
      })
    });

    if (!response.ok) {
      throw new Error('Cannot activate this effect');
    }

    return response.json();
  }

  async resetTurn(battleId: number, battleCharacterId?: number): Promise<void> {
    await fetch(`${this.baseUrl}/reset-turn/${battleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        battleCharacterId ? { battleCharacterId } : {}
      )
    });
  }

  async listByCharacter(battleCharacterId: number): Promise<PictoEffectTracker[]> {
    const response = await fetch(`${this.baseUrl}/character/${battleCharacterId}`);
    return response.json();
  }

  async clearBattle(battleId: number): Promise<void> {
    await fetch(`${this.baseUrl}/clear/${battleId}`, {
      method: 'DELETE'
    });
  }
}

// Uso em componente
const pictoService = new PictoEffectService();

async function handlePictoClick(pictoName: string, effectType: 'once-per-battle' | 'once-per-turn') {
  try {
    // Verificar se pode ativar
    const check = await pictoService.canActivate(
      battleCharacterId,
      pictoName,
      battleId,
      effectType
    );

    if (!check.canActivate) {
      if (effectType === 'once-per-battle') {
        showError('Esta habilidade já foi usada nesta batalha!');
      } else {
        showError('Esta habilidade já foi usada neste turno!');
      }
      return;
    }

    // Executar efeito do picto
    await executePictoEffect(pictoName);

    // Registrar uso
    await pictoService.track(battleId, battleCharacterId, pictoName, effectType);

    showSuccess('Habilidade ativada com sucesso!');
  } catch (error) {
    showError('Erro ao ativar habilidade');
  }
}

// Hook para resetar efeitos no fim do turno
async function handleEndTurn() {
  await pictoService.resetTurn(battleId, currentCharacterId);
  // ... resto da lógica de fim de turno
}

// Hook para limpar ao fim da batalha
async function handleEndBattle() {
  await pictoService.clearBattle(battleId);
  // ... resto da lógica de fim de batalha
}
```

---

## Testes Manuais via cURL

### Setup de Batalha de Teste

```bash
# Assumindo que você já tem uma batalha criada (ID: 100)
# e personagens na batalha (IDs: 1, 2, 3)

# 1. Verificar estado inicial (deve estar vazio)
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100

# 2. Personagem 1 usa Ultimate (once-per-battle)
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "UltimateStrike",
    "effectType": "once-per-battle"
  }'

# 3. Personagem 1 tenta usar Ultimate novamente (deve falhar)
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "UltimateStrike",
    "effectType": "once-per-battle"
  }'

# 4. Personagem 2 usa QuickDraw (once-per-turn)
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 2,
    "pictoName": "QuickDraw",
    "effectType": "once-per-turn"
  }'

# 5. Listar todos os trackers
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100

# 6. Fim do turno do Personagem 2
curl -X POST http://localhost:8080/api/battle/picto-effects/reset-turn/100 \
  -H "Content-Type: application/json" \
  -d '{"battleCharacterId": 2}'

# 7. Personagem 2 pode usar QuickDraw novamente
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 2,
    "pictoName": "QuickDraw",
    "effectType": "once-per-turn"
  }'

# 8. Fim da batalha - limpar tudo
curl -X DELETE http://localhost:8080/api/battle/picto-effects/clear/100

# 9. Verificar que está vazio
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100
```

---

## Validação de Logs

Após executar os exemplos acima, você pode verificar os logs na tabela `battle_log`:

```sql
SELECT * FROM battle_log
WHERE battle_id = 100
  AND event_type IN ('PICTO_EFFECT_TRACKED', 'PICTO_EFFECTS_RESET', 'PICTO_EFFECTS_CLEARED')
ORDER BY id DESC;
```

Você deve ver entradas como:
- `PICTO_EFFECT_TRACKED` com JSON contendo battleCharacterId, pictoName, effectType, timesTriggered
- `PICTO_EFFECTS_RESET` com JSON contendo battleId, battleCharacterId, action
- `PICTO_EFFECTS_CLEARED` quando a batalha foi limpa
