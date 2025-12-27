# Quick Start - Sistema de Tracking de Efeitos Picto

Guia rápido para começar a usar o sistema de tracking.

---

## 1. Iniciar o Backend

```bash
cd /Users/robsoncesardesiqueira/Documents/repositories/clairobscur-expedition33-rpg/api
./gradlew bootRun
```

A migration `V9__create_picto_effect_tracker.sql` será executada automaticamente.

---

## 2. Testar o Sistema

### Teste 1: Verificar se pode usar habilidade

```bash
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/1/FireStrike?battleId=100&effectType=once-per-battle"
```

**Resposta esperada:**
```json
{
  "canActivate": true,
  "timesTriggered": 0,
  "lastTurnTriggered": null
}
```

### Teste 2: Usar a habilidade

```bash
curl -X POST http://localhost:8080/api/battle/picto-effects/track \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": 100,
    "battleCharacterId": 1,
    "pictoName": "FireStrike",
    "effectType": "once-per-battle"
  }'
```

**Resposta esperada:** `200 OK` com dados do tracker

### Teste 3: Tentar usar novamente (deve bloquear)

```bash
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/1/FireStrike?battleId=100&effectType=once-per-battle"
```

**Resposta esperada:**
```json
{
  "canActivate": false,
  "timesTriggered": 1,
  "lastTurnTriggered": 1
}
```

---

## 3. Integração no Frontend (React/TypeScript)

### Instalar e configurar

```typescript
// services/pictoEffectService.ts

const API_URL = 'http://localhost:8080/api/battle/picto-effects';

export async function canUsePicto(
  battleCharacterId: number,
  pictoName: string,
  battleId: number,
  effectType: 'once-per-battle' | 'once-per-turn'
): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/check/${battleCharacterId}/${pictoName}?battleId=${battleId}&effectType=${effectType}`
  );
  const data = await response.json();
  return data.canActivate;
}

export async function usePicto(
  battleId: number,
  battleCharacterId: number,
  pictoName: string,
  effectType: 'once-per-battle' | 'once-per-turn'
): Promise<void> {
  const response = await fetch(`${API_URL}/track`, {
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
    throw new Error('Cannot use this picto');
  }
}

export async function resetTurn(battleId: number, battleCharacterId: number): Promise<void> {
  await fetch(`${API_URL}/reset-turn/${battleId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ battleCharacterId })
  });
}
```

### Usar no componente

```typescript
// components/PictoButton.tsx

import { canUsePicto, usePicto } from '../services/pictoEffectService';

interface PictoButtonProps {
  pictoName: string;
  effectType: 'once-per-battle' | 'once-per-turn';
  battleId: number;
  battleCharacterId: number;
  onSuccess: () => void;
}

export function PictoButton({
  pictoName,
  effectType,
  battleId,
  battleCharacterId,
  onSuccess
}: PictoButtonProps) {
  const [canUse, setCanUse] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar disponibilidade ao carregar
  useEffect(() => {
    async function check() {
      const available = await canUsePicto(
        battleCharacterId,
        pictoName,
        battleId,
        effectType
      );
      setCanUse(available);
    }
    check();
  }, [battleCharacterId, pictoName, battleId, effectType]);

  async function handleClick() {
    if (!canUse) return;

    setLoading(true);
    try {
      // Usar picto
      await usePicto(battleId, battleCharacterId, pictoName, effectType);

      // Executar efeito visual/lógica do picto
      onSuccess();

      // Atualizar estado
      setCanUse(false);

      toast.success('Habilidade usada com sucesso!');
    } catch (error) {
      toast.error('Erro ao usar habilidade');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canUse || loading}
      className={`picto-button ${!canUse ? 'disabled' : ''}`}
    >
      <img src={`/pictos/${pictoName}.png`} alt={pictoName} />
      {!canUse && <div className="used-indicator">USADO</div>}
      {loading && <div className="spinner" />}
    </button>
  );
}
```

### Resetar no fim do turno

```typescript
// components/BattleScreen.tsx

async function handleEndTurn() {
  setLoading(true);

  try {
    // Resetar efeitos once-per-turn
    await resetTurn(battleId, currentCharacterId);

    // ... resto da lógica de fim de turno ...

    // Avançar para próximo personagem
    nextTurn();
  } catch (error) {
    toast.error('Erro ao finalizar turno');
  } finally {
    setLoading(false);
  }
}
```

---

## 4. Casos de Uso Comuns

### Ultimate (Once Per Battle)

```typescript
// Habilidade que só pode ser usada uma vez na batalha
<PictoButton
  pictoName="UltimateStrike"
  effectType="once-per-battle"
  battleId={battleId}
  battleCharacterId={characterId}
  onSuccess={executeUltimateStrike}
/>
```

### Quick Attack (Once Per Turn)

```typescript
// Habilidade que pode ser usada uma vez por turno
<PictoButton
  pictoName="QuickDraw"
  effectType="once-per-turn"
  battleId={battleId}
  battleCharacterId={characterId}
  onSuccess={executeQuickDraw}
/>
```

---

## 5. Fluxo Completo de Batalha

### Início da Batalha

```typescript
async function startBattle(battleId: number) {
  // Criar batalha (já existente)
  await createBattle(battleId);

  // Não precisa fazer nada com tracking - será criado conforme usado
}
```

### Durante o Turno

```typescript
// 1. Jogador clica em um picto
// 2. Sistema verifica se pode usar (canUsePicto)
// 3. Se pode: executar e registrar (usePicto)
// 4. Se não pode: mostrar mensagem de bloqueio
```

### Fim do Turno

```typescript
async function endTurn(battleId: number, characterId: number) {
  // 1. Resolver efeitos de status
  await resolveStatusEffects(battleId, characterId);

  // 2. Resetar efeitos once-per-turn
  await resetTurn(battleId, characterId);

  // 3. Avançar para próximo personagem
  nextCharacter();
}
```

### Fim da Batalha

```typescript
async function endBattle(battleId: number) {
  // 1. Resolver recompensas
  await processRewards(battleId);

  // 2. Limpar trackers
  await fetch(`http://localhost:8080/api/battle/picto-effects/clear/${battleId}`, {
    method: 'DELETE'
  });

  // 3. Voltar para tela anterior
  navigate('/campaign');
}
```

---

## 6. Debugging

### Ver todos os trackers ativos

```bash
curl -X GET http://localhost:8080/api/battle/picto-effects/battle/100
```

### Ver trackers de um personagem

```bash
curl -X GET http://localhost:8080/api/battle/picto-effects/character/1
```

### Verificar logs no banco

```sql
SELECT * FROM battle_log
WHERE battle_id = 100
  AND event_type LIKE '%PICTO%'
ORDER BY id DESC;
```

---

## 7. Troubleshooting

### Problema: Efeito não está bloqueando

**Solução:** Verifique se está chamando `/track` após usar o picto

```typescript
// ERRADO - não registra
await executePictoEffect(pictoName);

// CORRETO - registra após executar
await executePictoEffect(pictoName);
await usePicto(battleId, characterId, pictoName, effectType);
```

### Problema: Efeito não reseta no próximo turno

**Solução:** Certifique-se de chamar `/reset-turn` ao fim do turno

```typescript
// No handleEndTurn
await resetTurn(battleId, currentCharacterId);
```

### Problema: Trackers não são limpos ao fim da batalha

**Solução:** Chame `/clear/{battleId}` ao finalizar

```typescript
// No handleEndBattle
await fetch(`${API_URL}/clear/${battleId}`, { method: 'DELETE' });
```

---

## 8. Próximos Passos

1. Rode os testes manuais (seção 2)
2. Implemente a integração no frontend (seção 3)
3. Teste em batalha real
4. Ajuste conforme necessário

---

## Documentação Completa

- **API Reference:** `PICTO_EFFECT_TRACKING.md`
- **Exemplos:** `PICTO_TRACKING_EXAMPLES.md`
- **Arquitetura:** `PICTO_TRACKING_ARCHITECTURE.md`
- **README:** `PICTO_TRACKING_README.md`

---

## Suporte

Se encontrar problemas:
1. Verifique os logs do backend
2. Verifique a tabela `battle_log`
3. Consulte a documentação completa
4. Entre em contato com a equipe de desenvolvimento
