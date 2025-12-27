# Exemplos de Uso - Sistema de Modificadores de Dano

## Cenários Práticos

### Cenário 1: Personagem com Especialização em Ataques Básicos

Um personagem que causa 50% mais dano com ataques básicos.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "base-attack",
  "multiplier": 1.5,
  "flatBonus": 0,
  "conditionType": null
}
```

**Teste de Dano:**
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

**Resultado:** Dano = 100 * 1.5 = **150**

---

### Cenário 2: Berserker (Mais Forte Quando com HP Baixo)

Personagem causa 80% mais dano quando está abaixo de 30% de HP.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.8,
  "flatBonus": 0,
  "conditionType": "low-hp"
}
```

**Teste:**
- Com HP > 30%: Dano = 100
- Com HP < 30%: Dano = 100 * 1.8 = **180**

---

### Cenário 3: Especialista em Queimaduras

Causa 40% mais dano contra inimigos queimando.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "skill",
  "multiplier": 1.4,
  "flatBonus": 0,
  "conditionType": "enemy-burning"
}
```

**Resultado:**
- Inimigo SEM Burning: Dano = 100
- Inimigo COM Burning: Dano = 100 * 1.4 = **140**

---

### Cenário 4: Tank com Contra-Ataque Poderoso

Causa o dobro de dano em contra-ataques.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "counter",
  "multiplier": 2.0,
  "flatBonus": 0,
  "conditionType": null
}
```

**Teste:**
```http
POST /api/attacks
Content-Type: application/json

{
  "sourceBattleId": 1,
  "targetBattleId": 2,
  "totalDamage": 80,
  "attackType": "counter",
  "effects": []
}
```

**Resultado:** Dano = 80 * 2.0 = **160**

---

### Cenário 5: Combo de Multiplicadores

Personagem com múltiplos modificadores ativos:
- +30% de dano em todos os ataques
- +50% de dano quando HP está cheio
- +25 de dano fixo

**Requests:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.3,
  "flatBonus": 0,
  "conditionType": null
}
```

```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.5,
  "flatBonus": 0,
  "conditionType": "full-hp"
}
```

```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.0,
  "flatBonus": 25,
  "conditionType": null
}
```

**Resultado:**
- Com HP cheio: 100 * 1.3 * 1.5 + 25 = **220**
- Sem HP cheio: 100 * 1.3 + 25 = **155**

---

### Cenário 6: Assassino (Primeiro Golpe Fatal)

O primeiro ataque causa +100 de dano adicional.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "first-hit",
  "multiplier": 1.0,
  "flatBonus": 100,
  "conditionType": null
}
```

**Teste:**
```http
POST /api/attacks
Content-Type: application/json

{
  "sourceBattleId": 1,
  "targetBattleId": 2,
  "totalDamage": 80,
  "attackType": "basic",
  "isFirstHit": true,
  "effects": []
}
```

**Resultado:**
- Primeiro hit: 80 + 100 = **180**
- Hits subsequentes: **80**

---

### Cenário 7: Atirador de Elite (Free Shot Preciso)

Causa 70% mais dano com tiros livres.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "free-aim",
  "multiplier": 1.7,
  "flatBonus": 0,
  "conditionType": null
}
```

**Teste:**
```http
POST /api/attacks
Content-Type: application/json

{
  "sourceBattleId": 1,
  "targetBattleId": 2,
  "totalDamage": 100,
  "attackType": "free-shot",
  "effects": []
}
```

**Resultado:** Dano = 100 * 1.7 = **170**

---

### Cenário 8: Explorador Solitário

Causa 60% mais dano quando está lutando sozinho.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.6,
  "flatBonus": 0,
  "conditionType": "solo"
}
```

**Resultado:**
- Com aliados: Dano = 100
- Sozinho: Dano = 100 * 1.6 = **160**

---

### Cenário 9: Caçador de Alvos Marcados

Causa 50% mais dano contra alvos marcados + 20 de dano fixo.

**Requests:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.5,
  "flatBonus": 0,
  "conditionType": "enemy-marked"
}
```

```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "all",
  "multiplier": 1.0,
  "flatBonus": 20,
  "conditionType": "enemy-marked"
}
```

**Resultado:**
- Sem Marked: Dano = 100
- Com Marked: (100 * 1.5) + 20 = **170**

---

### Cenário 10: Mago Energizado (Twilight)

Causa 100% mais dano quando tem status Twilight ativo.

**Request:**
```http
POST /api/battle/characters/1/modifiers
Content-Type: application/json

{
  "modifierType": "skill",
  "multiplier": 2.0,
  "flatBonus": 0,
  "conditionType": "twilight-active"
}
```

**Resultado:**
- Sem Twilight: Dano = 100
- Com Twilight: Dano = 100 * 2.0 = **200**

---

## Gerenciamento de Modificadores

### Listar Todos os Modificadores
```http
GET /api/battle/characters/1/modifiers
```

**Response:**
```json
[
  {
    "id": 1,
    "battleCharacterId": 1,
    "modifierType": "base-attack",
    "multiplier": 1.5,
    "flatBonus": 0,
    "conditionType": null,
    "isActive": true
  },
  {
    "id": 2,
    "battleCharacterId": 1,
    "modifierType": "all",
    "multiplier": 1.0,
    "flatBonus": 25,
    "conditionType": null,
    "isActive": false
  }
]
```

### Listar Apenas Modificadores Ativos
```http
GET /api/battle/characters/1/modifiers/active
```

### Desativar um Modificador
```http
PATCH /api/battle/characters/modifiers/1/deactivate
```

### Ativar um Modificador
```http
PATCH /api/battle/characters/modifiers/1/activate
```

### Remover um Modificador
```http
DELETE /api/battle/characters/modifiers/1
```

---

## Casos de Uso Avançados

### Build: Glass Cannon

Personagem com alto dano mas vulnerável:
- +50% dano em ataques básicos
- +100% dano com HP cheio
- +30 dano fixo em todos os ataques

**Dano com HP Cheio:** 100 * 1.5 * 2.0 + 30 = **330**
**Dano com HP Baixo:** 100 * 1.5 + 30 = **180**

### Build: Pyromancer

Especialista em queimaduras:
- +60% dano em habilidades
- +40% dano contra inimigos queimando
- +15 dano fixo contra inimigos queimando

**Dano contra inimigo queimando:** 100 * 1.6 * 1.4 + 15 = **239**

### Build: Counter Tank

Especialista em contra-ataques:
- +150% dano em contra-ataques
- +20 dano fixo em contra-ataques
- +30% dano com HP baixo

**Contra-ataque com HP baixo:** 100 * 2.5 * 1.3 + 20 = **345**

---

## Notas de Implementação

1. **Ordem de Aplicação:** Multiplicadores primeiro, depois bônus fixos
2. **Empilhamento:** Multiplicadores são multiplicativos entre si
3. **Condições:** São avaliadas no momento do ataque
4. **Performance:** Índices no banco garantem consultas rápidas
5. **Flexibilidade:** Modificadores podem ser ativados/desativados sem deletar
