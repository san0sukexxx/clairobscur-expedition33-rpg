# Sistema de Modificadores Passivos de Dano - Resumo da Implementação

## Status: Implementação Completa

## Arquivos Criados

### 1. Migration
- **Arquivo:** `src/main/resources/db/migration/V9__create_damage_modifier_table.sql`
- **Descrição:** Cria a tabela `damage_modifier` com índices otimizados

### 2. Model
- **Arquivo:** `src/main/kotlin/com/example/demo/model/DamageModifier.kt`
- **Descrição:** Entity JPA para representar modificadores de dano

### 3. Repository
- **Arquivo:** `src/main/kotlin/com/example/demo/repository/DamageModifierRepository.kt`
- **Descrição:** Interface JPA Repository com queries customizadas

### 4. Service
- **Arquivo:** `src/main/kotlin/com/example/demo/service/DamageModifierService.kt`
- **Descrição:** Lógica de negócio para cálculo e gerenciamento de modificadores
- **Métodos Principais:**
  - `calculateModifiedDamage()` - Calcula dano modificado
  - `addModifier()` - Adiciona novo modificador
  - `removeModifier()` - Remove modificador
  - `activateModifier()` / `deactivateModifier()` - Gerencia estado
  - `getModifiers()` / `getActiveModifiers()` - Consulta modificadores

### 5. Controller
- **Arquivo:** `src/main/kotlin/com/example/demo/controller/DamageModifierController.kt`
- **Descrição:** REST API para gerenciar modificadores
- **Endpoints:**
  - `GET /api/battle/characters/{id}/modifiers` - Lista todos
  - `GET /api/battle/characters/{id}/modifiers/active` - Lista ativos
  - `POST /api/battle/characters/{id}/modifiers` - Adiciona
  - `DELETE /api/battle/characters/modifiers/{id}` - Remove
  - `PATCH /api/battle/characters/modifiers/{id}/activate` - Ativa
  - `PATCH /api/battle/characters/modifiers/{id}/deactivate` - Desativa

### 6. DTO Update
- **Arquivo:** `src/main/kotlin/com/example/demo/dto/CreateAttackRequest.kt`
- **Modificação:** Adicionado campo `isFirstHit` para suportar modificadores de primeiro acerto

### 7. Controller Update
- **Arquivo:** `src/main/kotlin/com/example/demo/controller/AttackController.kt`
- **Modificações:**
  - Injeção de `DamageModifierService`
  - Integração do cálculo de modificadores no fluxo de dano
  - Contexto com informações para avaliação de condições

### 8. Documentação
- **DAMAGE_MODIFIERS.md** - Documentação técnica completa
- **DAMAGE_MODIFIERS_EXAMPLES.md** - Exemplos práticos de uso
- **test_damage_modifiers.sql** - Scripts de teste SQL

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

## Tipos de Modificadores

| Tipo | Descrição |
|------|-----------|
| `base-attack` | Ataques básicos |
| `counter` | Contra-ataques |
| `free-aim` | Tiros livres |
| `skill` | Habilidades |
| `first-hit` | Primeiro acerto |
| `all` | Todos os tipos |

## Condições Suportadas

| Condição | Descrição |
|----------|-----------|
| `solo` | Lutando sozinho |
| `full-hp` | HP cheio |
| `low-hp` | HP < 30% |
| `enemy-burning` | Alvo queimando |
| `enemy-marked` | Alvo marcado |
| `enemy-fragile` | Alvo frágil |
| `has-charges` | Tem cargas |
| `max-charges` | Carga máxima |
| `twilight-active` | Status Twilight ativo |
| `NULL` | Sempre ativo |

## Fluxo de Cálculo

1. **Busca Modificadores:** Recupera modificadores ativos do personagem
2. **Filtra por Tipo:** Aplica apenas os modificadores do tipo de ataque
3. **Avalia Condições:** Verifica se condições são atendidas
4. **Aplica Multiplicadores:** Multiplica dano base (multiplicativo)
5. **Aplica Bônus Fixos:** Adiciona bônus fixos (aditivo)
6. **Retorna Dano Final:** Garante dano >= 0

## Fórmula de Cálculo

```
dano_final = (dano_base × multiplicador1 × multiplicador2 × ... × multiplicadorN) + bonus1 + bonus2 + ... + bonusN
```

## Integração com AttackController

O cálculo de modificadores é aplicado automaticamente no `AttackController` antes de aplicar o dano:

```kotlin
// Contexto para avaliação de condições
val modifierContext = mapOf(
    "targetBattleCharacterId" to targetBC.id!!,
    "isFirstHit" to (body.isFirstHit ?: false),
    "isSolo" to (allies.isEmpty())
)

// Calcula dano modificado
val modifiedDamage = damageModifierService.calculateModifiedDamage(
    battleCharacterId = body.sourceBattleId,
    baseDamage = body.totalDamage,
    attackType = body.attackType ?: "basic",
    context = modifierContext
)

// Aplica dano modificado
damageService.applyDamage(targetBC, modifiedDamage)
```

## Exemplo de Uso Completo

### 1. Adicionar Modificador

```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.5,
  "flatBonus": 20,
  "conditionType": "enemy-burning"
}
```

### 2. Atacar com Modificador

```http
POST /api/attacks
Content-Type: application/json

{
  "sourceBattleId": 1,
  "targetBattleId": 2,
  "totalDamage": 100,
  "attackType": "basic",
  "effects": []
}
```

### 3. Resultado
- Se alvo NÃO está queimando: 100 de dano
- Se alvo ESTÁ queimando: (100 × 1.5) + 20 = **170 de dano**

## Testes Recomendados

### 1. Teste de Build
```bash
cd /path/to/api
./gradlew build
```

### 2. Teste de Migration
- Iniciar aplicação
- Verificar se tabela `damage_modifier` foi criada
- Verificar índices

### 3. Teste de API
```bash
# Adicionar modificador
curl -X POST http://localhost:8080/api/battle/characters/1/modifiers \
  -H "Content-Type: application/json" \
  -d '{"modifierType":"all","multiplier":1.5,"flatBonus":0}'

# Listar modificadores
curl http://localhost:8080/api/battle/characters/1/modifiers

# Testar ataque
curl -X POST http://localhost:8080/api/attacks \
  -H "Content-Type: application/json" \
  -d '{"sourceBattleId":1,"targetBattleId":2,"totalDamage":100,"attackType":"basic","effects":[]}'
```

### 4. Teste de Condições
- Criar modificador com condição `low-hp`
- Reduzir HP do personagem para < 30%
- Verificar se dano aumenta

### 5. Teste de Múltiplos Modificadores
- Adicionar 3+ modificadores diferentes
- Verificar cálculo composto
- Exemplo: 100 × 1.5 × 1.3 + 20 + 10 = 225

## Próximos Passos

1. **Testes Unitários:** Criar testes para `DamageModifierService`
2. **Testes de Integração:** Testar fluxo completo de ataque
3. **Performance:** Monitorar queries e otimizar se necessário
4. **UI/Frontend:** Integrar com interface do usuário
5. **Balance:** Ajustar multiplicadores baseado em gameplay

## Observações Importantes

1. **Banco de Dados:** Usa SQLite (INTEGER PRIMARY KEY AUTOINCREMENT)
2. **Transações:** Service usa `@Transactional` para garantir consistência
3. **Performance:** Índices criados em `battle_character_id` e `is_active`
4. **Extensibilidade:** Fácil adicionar novas condições em `evaluateCondition()`
5. **Compatibilidade:** Integrado sem quebrar funcionalidades existentes

## Suporte e Manutenção

### Adicionar Nova Condição

Editar `DamageModifierService.evaluateCondition()`:

```kotlin
"nova-condicao" -> {
    // Lógica da nova condição
    return true/false
}
```

### Adicionar Novo Tipo de Modificador

Editar `DamageModifierService.calculateModifiedDamage()`:

```kotlin
"novo-tipo" -> attackType == "novo-tipo-ataque"
```

### Debug

Adicionar logs em `calculateModifiedDamage()` para verificar:
- Modificadores encontrados
- Modificadores aplicáveis
- Modificadores válidos após condições
- Cálculo final

## Conclusão

Sistema de modificadores passivos de dano implementado com sucesso, incluindo:
- ✅ Migration de banco de dados
- ✅ Entities, repositories e services
- ✅ REST API completa
- ✅ Integração com sistema de combate existente
- ✅ Suporte a condições complexas
- ✅ Documentação completa
- ✅ Exemplos práticos

O sistema está pronto para uso e pode ser facilmente estendido com novas funcionalidades.
