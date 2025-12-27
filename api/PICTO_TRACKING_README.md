# Sistema de Tracking de Efeitos Picto - Implementação Completa

## Visão Geral

Sistema completo para rastrear efeitos "once per battle" e "once per turn" em batalhas do jogo Clair Obscur: Expedition 33 RPG.

## Arquivos Criados

### 1. Migration
- **Arquivo:** `/src/main/resources/db/migration/V9__create_picto_effect_tracker.sql`
- **Descrição:** Cria a tabela `picto_effect_tracker` no banco de dados
- **Tabela:**
  - `id`: Identificador único
  - `battle_id`: ID da batalha
  - `battle_character_id`: ID do personagem na batalha
  - `picto_name`: Nome do picto/habilidade
  - `effect_type`: Tipo do efeito (once-per-battle, once-per-turn, counter)
  - `times_triggered`: Número de vezes que foi ativado
  - `last_turn_triggered`: Último turno em que foi ativado
  - `reset_on_turn_end`: Flag para resetar no fim do turno

### 2. Entity
- **Arquivo:** `/src/main/kotlin/com/example/demo/model/PictoEffectTracker.kt`
- **Descrição:** Entity JPA representando a tabela
- **Anotações:** `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`

### 3. Repository
- **Arquivo:** `/src/main/kotlin/com/example/demo/repository/PictoEffectTrackerRepository.kt`
- **Descrição:** Interface JPA Repository
- **Métodos:**
  - `findByBattleIdAndBattleCharacterIdAndPictoName()`: Buscar tracker específico
  - `findByBattleId()`: Buscar todos os trackers de uma batalha
  - `findByBattleCharacterId()`: Buscar todos os trackers de um personagem
  - `deleteByBattleId()`: Deletar todos os trackers de uma batalha

### 4. DTOs
- **Arquivo:** `/src/main/kotlin/com/example/demo/dto/PictoEffectTrackerDto.kt`
- **Classes:**
  - `TrackEffectRequest`: Request para registrar ativação
  - `CanActivateResponse`: Response para verificação de disponibilidade
  - `PictoEffectTrackerResponse`: Response com dados do tracker
  - `ResetTurnRequest`: Request para resetar efeitos

### 5. Service
- **Arquivo:** `/src/main/kotlin/com/example/demo/service/PictoEffectTrackerService.kt`
- **Métodos Principais:**
  - `canActivate()`: Verifica se um efeito pode ser ativado
  - `track()`: Registra a ativação de um efeito
  - `resetTurn()`: Reseta efeitos "once per turn"
  - `getTracker()`: Obtém informações de um tracker
  - `listTrackersByBattle()`: Lista todos os trackers de uma batalha
  - `listTrackersByCharacter()`: Lista todos os trackers de um personagem
  - `clearBattle()`: Remove todos os trackers de uma batalha

### 6. Controller
- **Arquivo:** `/src/main/kotlin/com/example/demo/controller/PictoEffectTrackerController.kt`
- **Endpoints:**
  - `POST /api/battle/picto-effects/track`: Registrar ativação
  - `GET /api/battle/picto-effects/check/{battleCharacterId}/{pictoName}`: Verificar disponibilidade
  - `POST /api/battle/picto-effects/reset-turn/{battleId}`: Resetar efeitos
  - `GET /api/battle/picto-effects/battle/{battleId}`: Listar trackers da batalha
  - `GET /api/battle/picto-effects/character/{battleCharacterId}`: Listar trackers do personagem
  - `GET /api/battle/picto-effects/tracker/{battleId}/{battleCharacterId}/{pictoName}`: Obter tracker específico
  - `DELETE /api/battle/picto-effects/clear/{battleId}`: Limpar trackers da batalha

### 7. Documentação
- **Arquivo:** `PICTO_EFFECT_TRACKING.md`
- **Conteúdo:** Documentação completa da API com exemplos de uso

### 8. Exemplos
- **Arquivo:** `PICTO_TRACKING_EXAMPLES.md`
- **Conteúdo:** Exemplos práticos de uso com cURL e TypeScript

---

## Estrutura de Diretórios

```
api/
├── src/
│   └── main/
│       ├── kotlin/com/example/demo/
│       │   ├── controller/
│       │   │   └── PictoEffectTrackerController.kt
│       │   ├── dto/
│       │   │   └── PictoEffectTrackerDto.kt
│       │   ├── model/
│       │   │   └── PictoEffectTracker.kt
│       │   ├── repository/
│       │   │   └── PictoEffectTrackerRepository.kt
│       │   └── service/
│       │       └── PictoEffectTrackerService.kt
│       └── resources/
│           └── db/migration/
│               └── V9__create_picto_effect_tracker.sql
├── PICTO_EFFECT_TRACKING.md
├── PICTO_TRACKING_EXAMPLES.md
└── PICTO_TRACKING_README.md (este arquivo)
```

---

## Tipos de Efeito Suportados

### 1. Once Per Battle
- **Descrição:** Efeito pode ser ativado apenas uma vez durante toda a batalha
- **Uso:** Habilidades ultimate, buffs permanentes
- **Reset:** Apenas ao fim da batalha (ou manualmente via `clearBattle()`)

### 2. Once Per Turn
- **Descrição:** Efeito pode ser ativado uma vez por turno do personagem
- **Uso:** Habilidades rápidas, ações de reação
- **Reset:** Automaticamente ao fim do turno (via `resetTurn()`)

### 3. Counter
- **Descrição:** Contador que incrementa indefinidamente
- **Uso:** Tracking de estatísticas, combos
- **Reset:** Manual

---

## Como Usar

### Passo 1: Executar Migration
```bash
# A migration será executada automaticamente ao iniciar a aplicação
./gradlew bootRun
```

### Passo 2: Verificar Disponibilidade
```bash
curl -X GET "http://localhost:8080/api/battle/picto-effects/check/1/FireStrike?battleId=100&effectType=once-per-battle"
```

### Passo 3: Registrar Uso
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

### Passo 4: Resetar ao Fim do Turno
```bash
curl -X POST http://localhost:8080/api/battle/picto-effects/reset-turn/100 \
  -H "Content-Type: application/json" \
  -d '{"battleCharacterId": 1}'
```

---

## Integração com Sistema Existente

### Opção 1: Manual via Frontend
O frontend chama os endpoints quando necessário:
- Antes de usar um picto: chama `/check`
- Após usar: chama `/track`
- Fim do turno: chama `/reset-turn`

### Opção 2: Automática via Backend
Integrar com o `BattleTurnService` existente:

```kotlin
@Service
class BattleTurnService(
    // ... dependências existentes ...
    private val pictoEffectTrackerService: PictoEffectTrackerService
) {
    @Transactional
    fun endTurn(battleId: Int, battleCharacterId: Int) {
        // ... lógica existente de fim de turno ...

        // Resetar efeitos once-per-turn
        pictoEffectTrackerService.resetTurn(battleId, battleCharacterId)
    }

    @Transactional
    fun endBattle(battleId: Int) {
        // ... lógica existente de fim de batalha ...

        // Limpar todos os trackers
        pictoEffectTrackerService.clearBattle(battleId)
    }
}
```

---

## Logging e Auditoria

Todas as operações são registradas na tabela `battle_log`:

- **`PICTO_EFFECT_TRACKED`**: Quando um efeito é ativado
  ```json
  {
    "battleCharacterId": 1,
    "pictoName": "FireStrike",
    "effectType": "once-per-battle",
    "timesTriggered": 1
  }
  ```

- **`PICTO_EFFECTS_RESET`**: Quando efeitos são resetados
  ```json
  {
    "battleId": 100,
    "battleCharacterId": 1,
    "action": "reset_turn"
  }
  ```

- **`PICTO_EFFECTS_CLEARED`**: Quando todos os trackers são removidos

---

## Validação e Segurança

### Validações Automáticas
1. **Once Per Battle:** Verifica se `timesTriggered == 0`
2. **Once Per Turn:** Verifica se `lastTurnTriggered != currentTurn`
3. **Counter:** Sempre permite (incrementa contador)

### Tratamento de Erros
- `400 Bad Request`: Quando tenta ativar um efeito que não pode ser ativado
- `404 Not Found`: Quando tenta obter um tracker que não existe
- `204 No Content`: Para operações de reset/clear bem-sucedidas

---

## Performance

### Índices Recomendados (se necessário no futuro)
```sql
CREATE INDEX idx_picto_tracker_battle ON picto_effect_tracker(battle_id);
CREATE INDEX idx_picto_tracker_character ON picto_effect_tracker(battle_character_id);
CREATE INDEX idx_picto_tracker_lookup ON picto_effect_tracker(battle_id, battle_character_id, picto_name);
```

### Otimizações
- Cascade delete automático quando batalha/personagem é deletado
- Trackers "once-per-turn" são deletados ao fim do turno (não apenas marcados)
- Queries específicas para cada caso de uso

---

## Testes

### Testes Manuais
Veja `PICTO_TRACKING_EXAMPLES.md` para cenários completos de teste

### Testes Unitários (sugestão para implementação futura)
```kotlin
@Test
fun `should allow once-per-battle effect on first use`() {
    // Arrange
    val battleId = 1
    val battleCharacterId = 1
    val pictoName = "Ultimate"
    val effectType = "once-per-battle"

    // Act
    val canActivate = service.canActivate(battleId, battleCharacterId, pictoName, effectType)

    // Assert
    assertTrue(canActivate)
}

@Test
fun `should block once-per-battle effect on second use`() {
    // Arrange
    val battleId = 1
    val battleCharacterId = 1
    val pictoName = "Ultimate"
    val effectType = "once-per-battle"

    service.track(battleId, battleCharacterId, pictoName, effectType)

    // Act
    val canActivate = service.canActivate(battleId, battleCharacterId, pictoName, effectType)

    // Assert
    assertFalse(canActivate)
}
```

---

## Próximos Passos

### Melhorias Futuras
1. **Cooldowns:** Adicionar suporte para efeitos com cooldown de N turnos
2. **Charges:** Adicionar suporte para efeitos com múltiplas cargas
3. **Condições:** Adicionar condições complexas (ex: "only if HP > 50%")
4. **UI:** Criar interface visual para mostrar efeitos ativos e disponíveis
5. **Analytics:** Dashboard para análise de uso de habilidades

### Extensões Possíveis
```kotlin
// Exemplo: Cooldown de 3 turnos
effectType = "cooldown-3-turns"

// Exemplo: Múltiplas cargas
effectType = "charges-3"

// Exemplo: Condicional
effectType = "once-per-battle-if-hp-low"
```

---

## Suporte

Para dúvidas ou problemas:
1. Consulte `PICTO_EFFECT_TRACKING.md` para documentação da API
2. Consulte `PICTO_TRACKING_EXAMPLES.md` para exemplos práticos
3. Verifique os logs na tabela `battle_log`
4. Entre em contato com a equipe de desenvolvimento

---

## Changelog

### v1.0.0 (2024-12-27)
- Implementação inicial
- Suporte para once-per-battle, once-per-turn, counter
- 7 endpoints REST
- Logging completo
- Documentação e exemplos
