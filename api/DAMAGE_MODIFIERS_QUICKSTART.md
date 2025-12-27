# Quick Start - Sistema de Modificadores de Dano

## Para Desenvolvedores

### Setup Rápido

1. **Migration já está criada**: `V9__create_damage_modifier_table.sql`
2. **Restart a aplicação**: A migration será aplicada automaticamente
3. **Pronto para usar!**

### Uso Básico

#### Adicionar um modificador via API

```bash
curl -X POST http://localhost:8080/api/battle/characters/1/modifiers \
  -H "Content-Type: application/json" \
  -d '{
    "modifierType": "base-attack",
    "multiplier": 1.5,
    "flatBonus": 0,
    "conditionType": null
  }'
```

#### Listar modificadores

```bash
curl http://localhost:8080/api/battle/characters/1/modifiers
```

#### Testar em combate

```bash
curl -X POST http://localhost:8080/api/attacks \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBattleId": 1,
    "targetBattleId": 2,
    "totalDamage": 100,
    "attackType": "basic",
    "effects": []
  }'
```

### Uso Programático

#### No Service/Controller

```kotlin
// Injetar o serviço
@Autowired
private lateinit var damageModifierService: DamageModifierService

// Adicionar modificador
val modifier = damageModifierService.addModifier(
    battleCharacterId = 1,
    type = "base-attack",
    multiplier = 1.5,
    flatBonus = 0,
    condition = null
)

// Calcular dano modificado
val modifiedDamage = damageModifierService.calculateModifiedDamage(
    battleCharacterId = 1,
    baseDamage = 100,
    attackType = "basic",
    context = mapOf(
        "targetBattleCharacterId" to 2,
        "isFirstHit" to false,
        "isSolo" to false
    )
)
```

### Tipos Comuns

| modifierType | Quando Usar |
|--------------|-------------|
| `"base-attack"` | Bônus em ataques básicos |
| `"counter"` | Bônus em contra-ataques |
| `"free-aim"` | Bônus em tiros livres |
| `"skill"` | Bônus em habilidades |
| `"all"` | Bônus em todos os ataques |

### Condições Comuns

| conditionType | Quando Ativo |
|---------------|--------------|
| `null` | Sempre |
| `"full-hp"` | HP = 100% |
| `"low-hp"` | HP < 30% |
| `"enemy-burning"` | Alvo queimando |
| `"solo"` | Sem aliados |

### Exemplos Rápidos

#### 1. Berserker (+50% dano com HP baixo)
```kotlin
damageModifierService.addModifier(
    battleCharacterId = id,
    type = "all",
    multiplier = 1.5,
    condition = "low-hp"
)
```

#### 2. Glass Cannon (+100% dano com HP cheio)
```kotlin
damageModifierService.addModifier(
    battleCharacterId = id,
    type = "all",
    multiplier = 2.0,
    condition = "full-hp"
)
```

#### 3. Pyromancer (+40% contra queimando)
```kotlin
damageModifierService.addModifier(
    battleCharacterId = id,
    type = "skill",
    multiplier = 1.4,
    condition = "enemy-burning"
)
```

#### 4. Arma Afiada (+25 dano fixo)
```kotlin
damageModifierService.addModifier(
    battleCharacterId = id,
    type = "all",
    multiplier = 1.0,
    flatBonus = 25
)
```

### SQL Direto (Para testes)

```sql
-- Adicionar modificador
INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
VALUES (1, 'all', 1.5, 0, NULL, 1);

-- Ver modificadores
SELECT * FROM damage_modifier WHERE battle_character_id = 1;

-- Desativar
UPDATE damage_modifier SET is_active = 0 WHERE id = 1;

-- Remover
DELETE FROM damage_modifier WHERE id = 1;
```

### Debug

Para debugar o cálculo de dano, adicione logs em `DamageModifierService.calculateModifiedDamage()`:

```kotlin
println("Base damage: $baseDamage")
println("Active modifiers: ${activeModifiers.size}")
println("Applicable modifiers: ${applicableModifiers.size}")
println("Valid modifiers: ${validModifiers.size}")
println("Modified damage: $modifiedDamage")
```

### Testes Unitários

Exemplo de teste:

```kotlin
@Test
fun testDamageModifier() {
    // Setup
    val modifier = damageModifierService.addModifier(
        battleCharacterId = 1,
        type = "base-attack",
        multiplier = 1.5
    )

    // Test
    val damage = damageModifierService.calculateModifiedDamage(
        battleCharacterId = 1,
        baseDamage = 100,
        attackType = "basic"
    )

    // Assert
    assertEquals(150, damage)
}
```

### Checklist de Implementação

- [x] Migration criada
- [x] Entity, Repository, Service criados
- [x] Controller com endpoints REST
- [x] Integrado com AttackController
- [x] Documentação completa
- [ ] Build e teste
- [ ] Deploy

### Troubleshooting

**Q: Modificador não está sendo aplicado**
- Verificar se `is_active = 1`
- Verificar se `modifier_type` corresponde ao `attackType`
- Verificar se condição está sendo atendida

**Q: Dano está errado**
- Lembrar que multiplicadores são multiplicativos
- Exemplo: 1.5 × 1.3 = 1.95, não 1.8

**Q: Migration não rodou**
- Verificar nome do arquivo: `V9__create_damage_modifier_table.sql`
- Verificar se não tem migrations anteriores faltando
- Limpar banco e reiniciar: `rm data/rpg.db`

### Recursos

- **Documentação completa**: `DAMAGE_MODIFIERS.md`
- **Exemplos práticos**: `DAMAGE_MODIFIERS_EXAMPLES.md`
- **Queries úteis**: `damage_modifier_queries.sql`
- **Script de teste**: `test_damage_modifiers.sql`
- **Resumo**: `IMPLEMENTATION_SUMMARY.md`

### Próximos Passos

1. Rodar a aplicação e testar
2. Criar alguns modificadores de teste
3. Testar em combate real
4. Ajustar valores de multiplier conforme necessário
5. Implementar UI para gerenciar modificadores

## Para Game Designers

### Balanceamento

Multiplicadores recomendados:
- **Pequeno bônus**: 1.1 - 1.2 (+10-20%)
- **Bônus médio**: 1.3 - 1.5 (+30-50%)
- **Bônus grande**: 1.6 - 2.0 (+60-100%)
- **Bônus extremo**: 2.0+ (+100%+)

Bônus fixos recomendados:
- **Pequeno**: 5-10 dano
- **Médio**: 15-30 dano
- **Grande**: 35-50 dano
- **Extremo**: 50+ dano

### Builds Sugeridos

1. **Tank Counter**: +100% dano em counters
2. **Glass Cannon**: +100% com HP cheio, vulnerável
3. **Berserker**: +80% com HP baixo
4. **Pyromancer**: +60% contra queimando + aplica burn
5. **Sniper**: +70% em free shots
6. **First Blood**: +100 dano no primeiro hit

### Condições Balanceadas

- **Sempre ativo**: 1.1 - 1.3x
- **Fácil de manter**: 1.3 - 1.5x (full-hp, max-charges)
- **Situacional**: 1.5 - 2.0x (enemy-burning, solo)
- **Raro**: 2.0x+ (multiple conditions)

---

**Sistema implementado e pronto para uso!**
