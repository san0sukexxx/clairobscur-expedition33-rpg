# Pictos Não Implementados

**Total: 64 pictos pendentes de implementação**

*Última atualização: 31/12/2024*

---

## ✅ Pictos Recentemente Implementados

### Enfeebling Mark
- **Descrição**: Se o atacante tiver o status "Marked", ele causa 30% a menos de dano contra o jogador que possui este picto
- **Status**: ✅ Implementado completamente (Frontend + Backend + UI)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com registro do picto (linha ~2519)
  - Frontend: PlayerPage.tsx exibe aviso no popup de ataque (linhas 779-788, 878-883)
  - Backend: DamageModifierService.calculateModifiedDamage() aplica multiplicador 0.7x (30% redução):
    * Verifica se **defensor** (target) tem enfeebling-mark equipado em slot 0-2
    * Verifica se **atacante** (source) tem status "Marked"
    * Se ambas condições verdadeiras: dano × 0.7 (70% do original = 30% de redução)
  - **Mecânica Defensiva**: Diferente dos outros pictos de Break, este é defensivo (protege quem tem o picto)
  - **Condições**:
    * Defensor tem enfeebling-mark picto equipado
    * Atacante tem status "Marked" ativo
  - **Multiplicador**: 0.7x (70% do dano original = 30% de redução)
  - **UI**: Popup de ataque exibe "⚠️ Você está Marcado! Alvo pode ter Enfeebling Mark (-30%)" em vermelho
  - **Nota**: Popup aparece quando jogador Marcado ataca outro jogador (PvP)
  - **Exemplo**: Atacante Marcado causa 100 dano → Defensor com Enfeebling Mark recebe apenas 70 dano

### Breaking Burn
- **Descrição**: Apenas para ataques em que o alvo tiver status "Burning": Se o alvo estiver com status "Fragile" e o ataque aplicar "Broken", aumenta o dano em 25%. Se o alvo já estiver com status "Broken", aumenta o dano em 25%
- **Status**: ✅ Implementado completamente (Frontend + Backend + UI)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com registro do picto (linha ~2508)
  - Frontend: PlayerPage.tsx exibe informação no popup de ataque (linhas 769-777, 861-866)
  - Backend: DamageModifierService.calculateModifiedDamage() aplica multiplicador 1.25x nas condições:
    * Alvo tem status "Burning" E "Broken": +25% dano
    * Alvo tem status "Burning" E "Fragile" E ataque vai aplicar "Broken": +25% dano
  - Backend: AttackController passa "willApplyBroken" no context do modifierContext (linha ~268)
  - **Mecânica**: Verifica se jogador tem breaking-burn picto equipado em slot 0-2
  - **Condições (TODAS devem ser verdadeiras)**:
    * Alvo tem status "Burning" (obrigatório)
    * E `hasBroken`: Alvo tem status "Broken" OU
    * E `hasFragile && willBreak`: Alvo tem "Fragile" E o ataque aplicará "Broken"
  - **Multiplicador**: 1.25x (25% de aumento) aplicado antes dos flat bonuses
  - **UI**: Popup de ataque básico/tiro livre exibe "Breaking Burn: Alvo Burning+Broken/Fragile (+25%)" em laranja
  - **Diferença do Breaker**: Requer que o alvo esteja com Burning (condição adicional)
  - **Exemplo**: Ataque de 100 dano contra inimigo com Burning+Broken = 125 dano

### Breaker
- **Descrição**: Se o alvo estiver com status "Fragile" e o ataque aplicar "Broken", aumenta o dano em 25%. Se o alvo já estiver com status "Broken", aumenta o dano em 25%
- **Status**: ✅ Implementado completamente (Frontend + Backend + UI)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com registro do picto (linha ~2497)
  - Frontend: PlayerPage.tsx exibe informação no popup de ataque (linhas 758-767, 845-850)
  - Backend: DamageModifierService.calculateModifiedDamage() aplica multiplicador 1.25x nas condições:
    * Alvo tem status "Broken" existente: +25% dano
    * Alvo tem status "Fragile" E ataque vai aplicar "Broken" (willApplyBroken): +25% dano
  - Backend: AttackController passa "willApplyBroken" no context do modifierContext (linha ~268)
  - **Mecânica**: Verifica se jogador tem breaker picto equipado em slot 0-2
  - **Condições**:
    * `hasBroken`: Checa se alvo tem status "Broken" ativo
    * `hasFragile && willBreak`: Checa se alvo tem "Fragile" E o ataque aplicará "Broken"
  - **Multiplicador**: 1.25x (25% de aumento) aplicado antes dos flat bonuses
  - **UI**: Popup de ataque básico/tiro livre exibe "Breaker: Alvo Broken/Fragile (+25%)" em verde
  - **Exemplo**: Ataque de 100 dano contra inimigo com Broken = 125 dano

### Fueling Break
- **Descrição**: Quando o jogador aplica o status "Broken" a um inimigo, dobra a quantidade de stacks de "Burning" no alvo
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-break
  - Backend: checkFuelingBreakAndDoubleBurn() duplica os stacks de Burning quando Broken é aplicado
  - Backend: AttackController chama a função nos 3 locais onde "Broken" é aplicado:
    * Sniper Break (linha ~531)
    * Breaking Shots Break (linha ~577)
    * Breaking Attack Break (linha ~625)
  - **Mecânica**: Busca todos os status "Burning" no alvo e dobra o valor do campo `ammount`
  - **Exemplo**: Se o inimigo tem 3 stacks de Burning, após o Break terá 6 stacks
  - **Verificação**: Checa se o jogador tem fueling-break picto equipado em slot 0-2
  - **Log**: Evento "FUELING_BREAK_BURN_DOUBLED" registrado no BattleLog

### Quick Break
- **Descrição**: Concede um turno extra ao jogador quando aplica o status "Broken" a qualquer inimigo
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-break
  - Backend: BattleTurnService.grantExtraTurn() move o personagem para a posição 2 (próximo turno)
  - Backend: AttackController chama checkQuickBreakAndGrantExtraTurn() nos 3 locais onde "Broken" é aplicado:
    * Sniper Break (linha ~528)
    * Breaking Shots Break (linha ~571)
    * Breaking Attack Break (linha ~616)
  - **Mecânica**: Quando o jogador quebra (Break) um inimigo, ele joga novamente logo após o turno atual terminar
  - **Verificação**: Checa se o jogador tem quick-break picto equipado em slot 0-2
  - **Log**: Evento "QUICK_BREAK_EXTRA_TURN" registrado no BattleLog

### Successive Parry
- **Descrição**: Desabilita dodge. Cada block (parry) aumenta o dano em +5% até o fim do próximo turno (empilhável). Receber qualquer dano remove todos os stacks
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-parry
  - Frontend: PendingAttacksModal.tsx desabilita botão de dodge quando o status está ativo
  - Backend: DefenseController aplica status "SuccessiveParry" em cada block bem-sucedido (defenseType == "block")
  - **Status Effect**: "SuccessiveParry" com ammount = stacks
  - **Buff**: DamageModifierService aplica multiplicador dinâmico (1.0 + stacks × 0.05)
  - **Exemplo**: 4 blocks = 4 stacks = +20% damage (1.20x multiplier)
  - **Remoção**: AttackController remove TODOS os stacks ao receber qualquer dano (totalDamage > 0)
  - **Duração**: 2 turnos (turno atual + próximo turno), reseta a cada novo block
  - **Dodge Disable**: Botão dodge não renderiza quando hasSuccessiveParry == true

### Empowering Dodge
- **Descrição**: Cada dodge bem-sucedido aumenta o dano em +5% até o fim do próximo turno (empilhável até 10 stacks). Receber qualquer dano remove todos os stacks
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-dodge
  - Backend: DefenseController aplica status "EmpoweringDodge" em cada dodge bem-sucedido (defenseType == "dodge")
  - **Status Effect**: "EmpoweringDodge" com ammount = stacks (max 10)
  - **Limite**: `.coerceAtMost(10)` garante máximo de 10 stacks
  - **Buff**: DamageModifierService aplica multiplicador dinâmico (1.0 + stacks × 0.05)
  - **Exemplo**: 10 dodges = 10 stacks = +50% damage (1.5x multiplier máximo)
  - **Remoção**: AttackController remove TODOS os stacks ao receber qualquer dano (totalDamage > 0)
  - **Duração**: 2 turnos (turno atual + próximo turno), reseta a cada novo dodge

### Empowering Parry
- **Descrição**: Cada block (parry) bem-sucedido aumenta o dano em +5% até o fim do próximo turno (empilhável). Receber qualquer dano remove todos os stacks
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-parry
  - Backend: DefenseController aplica status "EmpoweringParry" em cada block bem-sucedido (defenseType == "block")
  - **Status Effect**: "EmpoweringParry" com ammount = stacks
  - **Buff**: DamageModifierService aplica multiplicador dinâmico (1.0 + stacks × 0.05)
  - **Exemplo**: 3 blocks = 3 stacks = +15% damage (1.15x multiplier)
  - **Remoção**: AttackController remove TODOS os stacks ao receber qualquer dano (totalDamage > 0)
  - **Duração**: 2 turnos (turno atual + próximo turno), reseta a cada novo block

### Charging Attack
- **Descrição**: Ataques básicos aumentam a barra de Gradient em +15% do máximo
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-base-attack
  - Backend: AttackController aumenta gradient do time ao fazer ataque básico
  - **Valor**: +5 pontos de gradient (15% de 36 pontos = 5.4 ≈ 5)
  - **Sistema Gradient**: Máximo 36 pontos (3 cargas × 12 pontos)
  - **Team-based**: Adiciona aos pontos do time (teamAGradientPoints ou teamBGradientPoints)
  - Aplica para cada ataque básico, incluindo hits extras de Combo Attack

### Breaking Attack
- **Descrição**: Se causar qualquer dano com ataque básico e alvo tiver Fragile, remove Fragile e aplica Broken por 1 turno
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-base-attack
  - Backend: AttackController verifica se ataque é basic, causa dano (totalDamage > 0), e jogador tem Breaking Attack equipado
  - **Conversão**: Remove status Fragile do alvo e adiciona Broken (1 turno)
  - **Log**: Registra evento "BREAKING_ATTACK_BREAK" no BattleLog
  - Similar ao Breaking Shots, mas para ataques básicos ao invés de tiro livre

### Powered Attack
- **Descrição**: Consome 1 MP por hit para aumentar dano em 20%
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com triggers on-base-attack e on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.2x multiplicador para tipo "all" (todos os ataques)
  - Condição: "has-mp" - verifica se personagem tem MP disponível (magicPoints > 0)
  - Sistema: Usa DamageModifierService existente
  - **MP Consumption**: AttackController consome 1 MP por hit se Powered Attack equipado e MP disponível
  - Aplica a cada hit individualmente (combo attacks consomem MP por hit)
  - Se MP chegar a 0, modificador deixa de aplicar automaticamente

### Combo Attack I, II e III
- **Descrição**: Adiciona hits extras aos ataques básicos (+1, +2, +3 respectivamente). Efeitos podem acumular
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-base-attack para todos os três pictos
  - Backend: BattleCharacterService.calculateExtraBaseAttackHits() soma hits extras de todos os pictos equipados
  - Combo Attack I: +1 hit
  - Combo Attack II: +2 hits
  - Combo Attack III: +3 hits
  - **Stackable**: Se equipar I+II+III = +6 hits totais (1+2+3)
  - **Hit Processing**: AttackController processa hits extras recursivamente após o primeiro hit
  - Hits extras usam mesmo dano base, não aplicam status effects, não consomem MP/carga
  - isFirstHit = false nos hits extras (não ativam Augmented First Strike novamente)

### Augmented First Strike
- **Descrição**: Causa 50% mais dano no primeiro ataque da batalha (once per battle)
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com triggers on-base-attack e on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador para tipo "all" (todos os ataques)
  - Condição: "first-hit-in-battle" - usa PictoEffectTrackerService para rastrear once-per-battle
  - Sistema: Usa DamageModifierService existente + PictoEffectTrackerService
  - **Tracking**: AttackController marca primeiro ataque como usado (once-per-battle)
  - Aplica ao primeiro hit de qualquer tipo de ataque, incluindo o primeiro hit de skills multi-hit

### Augmented Attack
- **Descrição**: Causa 50% mais dano em ataques básicos
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-base-attack
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador para tipo "base-attack"
  - Condição: Sempre ativo (null) - aplica automaticamente a todos os ataques básicos
  - Sistema: Usa DamageModifierService existente

### Breaking Shots
- **Descrição**: Causa 50% mais dano em tiros livres se alvo tem Fragile ou Broken. Converte Fragile em Broken
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador para tipo "free-shot"
  - Condição: "enemy-fragile-or-broken" - verifica se alvo tem Fragile ou Broken
  - Sistema: Usa DamageModifierService existente
  - **Break Mechanic**: AttackController verifica se atacante tem Breaking Shots e ataque é free-shot
  - Se alvo tem Fragile: Remove Fragile e adiciona Broken (1 turno)
  - Log: Cria evento BREAKING_SHOTS_BREAK no BattleLog

### Versatile
- **Descrição**: Após acertar tiro livre, ataques básicos causam 50% mais dano por 1 turno
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com triggers on-free-aim e on-base-attack
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador para tipo "base-attack"
  - Condição: "versatile-buff" - verifica se status VersatileBuff está ativo
  - Sistema: Usa DamageModifierService existente + BattleStatusEffect
  - **Buff Application**: AttackController aplica VersatileBuff após free-shot bem-sucedido
  - Duração: 1 turno (remainingTurns = 1)
  - VersatileBuff é status temporário que decrementa naturalmente pelo sistema

### Sniper
- **Descrição**: Primeiro tiro livre do turno causa 200% mais dano e pode aplicar Broken
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 3.0x multiplicador (200% more = 3x total) para tipo "free-shot"
  - Condição: "sniper-first-shot" - usa PictoEffectTrackerService para rastrear once-per-turn
  - Sistema: Usa DamageModifierService existente + PictoEffectTrackerService
  - **Break Mechanic**: AttackController verifica se Sniper foi ativado neste ataque
  - Se alvo tem Fragile: Remove Fragile e adiciona Broken (1 turno)
  - Rastreamento: Marca Sniper como usado no turno após primeiro free-shot

### Piercing Shot
- **Descrição**: Causa 25% mais dano em tiros livres (Free Aim) e ignora escudos
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.25x multiplicador para tipo "free-shot"
  - Condição: Sempre ativo quando ataque é tiro livre
  - Aplica: Apenas a ataques do tipo "free-shot"
  - Sistema: Usa DamageModifierService existente
  - **Ignore Shields**: AttackController verifica se atacante tem Piercing Shot + ataque é free-shot
  - Quando ambos verdadeiros, shield NÃO é consumido (ignora proteção)

### Augmented Aim
- **Descrição**: Causa 50% mais dano em tiros livres (Free Aim)
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-free-aim
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador para tipo "free-shot"
  - Condição: Sempre ativo quando ataque é tiro livre
  - Aplica: Apenas a ataques do tipo "free-shot"
  - Sistema: Usa DamageModifierService existente

### Last Stand Critical
- **Descrição**: 100% de chance de crítico quando luta sozinho (sem aliados vivos)
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-attack
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 2.0x multiplicador com condição "solo" (equivalente a crítico garantido)
  - Condição: Ativa quando não há aliados vivos ou equipe está vazia
  - Aplica: A todos os tipos de ataque (básico, free-shot, skills, counter)
  - Sistema: Usa DamageModifierService existente

### Solo Fighter
- **Descrição**: Causa 50% mais dano quando luta sozinho (sem aliados vivos)
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024*
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-attack
  - Backend: BattleCharacterService cria DamageModifier quando personagem é adicionado
  - Modificador: 1.5x multiplicador com condição "solo"
  - Condição: Ativa quando não há aliados vivos ou equipe está vazia
  - Aplica: A todos os tipos de ataque (básico, free-shot, skills, counter)
  - Sistema: Usa DamageModifierService existente

### Healing Share
- **Descrição**: Recebe 15% de todas as curas que afetam outros personagens
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-heal-received
  - Backend: DamageService.applyHealingShare() chamado em todos os pontos de cura
  - Funcionalidade: Distribui 15% (arredondado para cima) da cura para todos os personagens com healing-share
  - Escopo: Funciona com poções (healing/revive-elixir), Regeneration, absorção de elementos, Clea's Life
  - Exclusão: Não recebe healing-share da própria cura
  - Respeita: Confident picto bloqueia o healing-share recebido
  - Log: "HEALING_SHARE" evento registrando detalhes da cura compartilhada

### Death Bomb
- **Descrição**: Ao morrer, causa dano de ataque básico a todos os inimigos
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-death
  - Backend: DamageService.checkDeathBomb() chamado quando HP = 0
  - Funcionalidade: Causa dano a todos os inimigos vivos quando personagem morre (HP passa de >0 para 0)
  - Cálculo de dano: 15% do maxHealthPoints do personagem morto (mínimo 5)
  - Alvo: Todos os personagens inimigos com HP > 0
  - Log: "DEATH_BOMB" evento registrando dano base e número de inimigos atingidos
  - Momento: Executa ANTES de limpar os turnos e status effects do personagem morto

### Auto Death
- **Descrição**: Personagem morre quando a batalha inicia (status "started")
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: BattleController.checkAutoDeathPicto() chamado quando battleStatus = "started"
  - Funcionalidade: Define HP=0, MP=0 quando batalha começa
  - Limpeza: Remove personagem da ordem de turnos (BattleTurn)
  - Limpeza: Remove todos os status effects do personagem
  - Log: "AUTO_DEATH" evento quando ativado
  - Momento: Executa APÓS criação dos turnos e APÓS log "BATTLE_STARTED"

### Clea's Life
- **Descrição**: Recupera 100% da vida no início do turno se não tomou dano no turno anterior
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService com rastreamento de dano por turno
  - Tabela: BattleTurnDamageTracker para rastrear dano recebido
  - Verificação: BattleTurnController chama checkCleasLife() no início do turno
  - Funcionalidade: Se damageTaken = 0 no turno anterior, cura para maxHP
  - Reset: Rastreamento é resetado a cada turno
  - Log: "CLEAS_LIFE" evento quando ativado

### Shortcut
- **Descrição**: Joga imediatamente quando HP cai abaixo de 30%. Uma vez por batalha.
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService.checkShortcut() verificando threshold de HP
  - Sistema de tracking: PictoEffectTracker (once-per-battle)
  - Manipulação de turnos: Insere personagem como primeiro na ordem (playOrder = lowest - 1)
  - Funcionalidade: Detecta quando HP cai abaixo de 30% e coloca como primeiro nos turnos
  - Verificação: HP estava acima de 30% ANTES do dano e ficou abaixo DEPOIS

### Effective Heal
- **Descrição**: Recebe o dobro de toda cura recebida
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService.applyEffectiveHeal() multiplicando cura por 2
  - Funcionalidade: Dobra TODA cura recebida (poções, habilidades, status, absorção de elementos)
  - Aplicação: DamageService (absorção), BattleStatusController (Regeneration), PlayerItemController (poções)
  - Modificador passivo: Sempre ativo quando equipado

### Revive Paradox
- **Descrição**: Joga imediatamente quando revivido
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: PlayerItemController com detecção de revive
  - Manipulação de turnos: Insere personagem como primeiro na ordem (initiative = lowest - 1)
  - Funcionalidade: Detecta quando personagem passa de HP = 0 para HP > 0
  - Aplicável: Apenas quando revivido por revive-elixir ou habilidades
  - Log: "REVIVE_PARADOX" evento quando ativado

### Defensive Mode
- **Descrição**: Ao receber dano, consome 1 MP para receber 30% menos dano (se possível)
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService com redução de 30% no dano recebido
  - Consumo de MP: Consome 1 MP por hit quando MP > 0
  - Arredondamento: Arredonda a redução para cima (ceil)
  - Funcionalidade: Aplica redução APÓS Confident, ANTES das regras de dano mínimo
  - Condicional: Não ativa se MP = 0

### Confident
- **Descrição**: Recebe 50% menos dano, mas não pode ser Curado.
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService com redução de 50% no dano recebido
  - Bloqueio de cura: Absorção de elementos (dano negativo), Regeneration, poções, habilidades
  - Funcionalidade: Aplica redução de dano APÓS todos os outros modificadores
  - Logs: "HEALING_BLOCKED" quando cura é bloqueada

### Solidifying
- **Descrição**: +2 Escudos quando a Vida do personagem cai abaixo de 50%. Uma vez por batalha.
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: DamageService.checkSolidifying() verificando threshold de HP
  - Sistema de tracking: PictoEffectTracker (once-per-battle)
  - Funcionalidade: Detecta quando HP cai abaixo de 50% e adiciona 2 Shields automaticamente
  - Verificação: HP estava acima de 50% ANTES do dano e ficou abaixo DEPOIS

### Energising Cleanse
- **Descrição**: Dissipa o primeiro Efeito de Status negativo recebido e ganha 2 PM
- **Status**: ✅ Implementado completamente (Frontend + Backend)
- **Data**: 31/12/2024
- **Implementação**:
  - Frontend: PictoEffects.ts com trigger on-battle-start
  - Backend: BattleStatusController com interceptação em addStatus()
  - Sistema de tracking: PictoEffectTracker (once-per-battle)
  - Funcionalidade: Previne primeiro status negativo e concede 2 MP

### Critical Burn
- **Descrição**: Pode acertar crítico tirando 5 no dado caso o alvo esteja sob Queimadura
- **Status**: ✅ Implementado completamente
- **Data**: 29/12/2024

---

## 🗑️ Pictos Removidos

### Perfect Reward (REMOVIDO)
- **Motivo**: Picto não utilizado no sistema
- **Data**: 31/12/2024

---

## ❌ Pictos Pendentes (85)

### 1. ENERGIA E AP (7 pictos)

---

### 5. DANO E COMBATE (1 picto)

#### Staggering Attack
- **Descrição**: "50% increased Break damage on Base Attack"
- **Complexidade**: Baixa
- **Requerimento**: Modificador passivo de break

---

### 6. PARRY E DODGE (0 pictos)

*Todos os pictos desta categoria foram implementados*

---

### 7. BREAK (2 pictos)

#### Critical Break
- **Descrição**: "25% increased Break damage on Critical hits"
- **Complexidade**: Baixa
- **Requerimento**: Modificador condicional de break

---

### 8. STATUS E MARCAS (3 pictos)

#### Charybde To Scylla
- **Descrição**: "Apply Mark on Stun removed"
- **Complexidade**: Média
- **Requerimento**: Detecção de remoção de status

#### Burn Affinity
- **Descrição**: "25% increased damage on Burning targets"
- **Complexidade**: Baixa
- **Requerimento**: Modificador condicional de dano

#### Frozen Affinity
- **Descrição**: "25% increased damage on Frozen targets"
- **Complexidade**: Baixa
- **Requerimento**: Modificador condicional de dano

---

### 9. RUSH E VELOCIDADE (5 pictos)

#### Longer Rush
- **Descrição**: "On applying Rush, its duration is increased by 2"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de duração de status

#### Cheater
- **Descrição**: "Always play twice in a row"
- **Complexidade**: Alta
- **Requerimento**: Manipulação complexa de ordem de turnos

#### Faster Than Strong
- **Descrição**: "Always play twice in a row, but deal 50% less damage"
- **Complexidade**: Alta
- **Requerimento**: Manipulação de turnos + modificador de dano

#### Teamwork
- **Descrição**: "10% increased damage while all allies are alive"
- **Complexidade**: Baixa
- **Requerimento**: Modificador condicional de dano

#### The One
- **Descrição**: "Max Health is reduced to 1"
- **Complexidade**: Média
- **Requerimento**: Modificação de HP máximo

---

### 10. TINTS E ITENS (7 pictos)

#### Revive Tint Energy
- **Descrição**: "Revive Tints also give 3 AP"
- **Complexidade**: Média
- **Requerimento**: Detecção de uso de Revive Tint

#### Better Healing Tint
- **Descrição**: "Healing Tints have double the Healing effect"
- **Complexidade**: Baixa
- **Requerimento**: Modificador passivo de cura de itens

#### Cleansing Tint
- **Descrição**: "Healing Tints also remove all Status Effects from the target"
- **Complexidade**: Média
- **Requerimento**: Remoção de status ao usar item

#### Great Healing Tint
- **Descrição**: "Healing Tints now affect the whole Expedition"
- **Complexidade**: Média
- **Requerimento**: Mudança de escopo de alvo de item

#### Great Energy Tint
- **Descrição**: "Energy Tints now affect the whole Expedition"
- **Complexidade**: Média
- **Requerimento**: Mudança de escopo de alvo de item

#### Charging Tint
- **Descrição**: "+5% of a Gradient Charge on using an item"
- **Complexidade**: Alta
- **Requerimento**: Sistema de Gradient Charge

#### Time Tint
- **Descrição**: "Energy Tints also apply Rush"
- **Complexidade**: Média
- **Requerimento**: Detecção de uso de Energy Tint + aplicação de status

---

### 11. GRADIENT (5 pictos)

#### Charging Hurt
- **Descrição**: "+5% of a Gradient Charge when taking damage. Once per turn"
- **Complexidade**: Alta
- **Requerimento**: Sistema completo de Gradient Charge

#### Charging Kill
- **Descrição**: "+15% of a Gradient Charge on each kill"
- **Complexidade**: Alta
- **Requerimento**: Sistema completo de Gradient Charge

#### Charging Chaos
- **Descrição**: "+20% of a Gradient Charge when receiving a negative Status Effect. Once per turn"
- **Complexidade**: Alta
- **Requerimento**: Sistema completo de Gradient Charge

#### Charging Shields
- **Descrição**: "+5% of a Gradient Charge when gaining Shields. Once per turn"
- **Complexidade**: Alta
- **Requerimento**: Sistema completo de Gradient Charge

#### Synchro Charges
- **Descrição**: "Once, gain 30% of a Gradient Charge on using a Gradient"
- **Complexidade**: Alta
- **Requerimento**: Sistema completo de Gradient Charge

---

### 12. COMBO E CHAIN (7 pictos)

#### Combo Gradient
- **Descrição**: "Gradient charges are gained 50% faster"
- **Complexidade**: Alta
- **Requerimento**: Sistema de Gradient Charge

#### Combo Duration
- **Descrição**: "All Status Effect durations +1"
- **Complexidade**: Baixa
- **Requerimento**: Modificador global de duração

#### Combo Power
- **Descrição**: "All Empowered Status Effect amounts +1"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de stacks de Empowered

#### Combo Shell
- **Descrição**: "All Protected Status Effect amounts +1"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de stacks de Protected

#### Combo Shield
- **Descrição**: "All Shielded Status Effect amounts +1"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de stacks de Shielded

#### Combo Burn
- **Descrição**: "All Burning Status Effect amounts +1"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de stacks de Burning

#### Combo Charge
- **Descrição**: "Charges accumulated from enemies on Break are increased by 50%"
- **Complexidade**: Alta
- **Requerimento**: Sistema de Gradient Charge

---

### 13. PERIGO E RISCO (2 pictos)

#### Hazardous Choice
- **Descrição**: "33% chance to skip own turn, but deal 50% more damage"
- **Complexidade**: Alta
- **Requerimento**: RNG na ordem de turnos + modificador de dano

#### Daredevil
- **Descrição**: "25% chance to receive a Critical hit, but deal 25% more damage"
- **Complexidade**: Média
- **Requerimento**: Modificador de chance de sofrer crítico + modificador de dano

---

### 14. COUNTER (9 pictos)

#### Counter Empower
- **Descrição**: "Apply 1 Empowered on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Shell
- **Descrição**: "Apply 1 Protected on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Rush
- **Descrição**: "Apply 1 Hastened on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Regen
- **Descrição**: "Apply 1 Regeneration on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Curse
- **Descrição**: "Apply 1 Cursed to attacker on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Burn
- **Descrição**: "Apply 1 Burning to attacker on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Counter Freeze
- **Descrição**: "Apply 1 Frozen to attacker on successful Counter"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Augmented Counter I
- **Descrição**: "Counter deals 25% more damage"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Augmented Counter II
- **Descrição**: "Counter deals 25% more damage"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

#### Augmented Counter III
- **Descrição**: "Counter deals 25% more damage"
- **Complexidade**: Média
- **Requerimento**: Sistema de Counter completo

---

### 15. ANTI-STATUS (14 pictos)

Todos requerem interceptação de aplicação de status effects.

- Anti Bound
- Anti Curse
- Anti Dizzy
- Anti Exhaust
- Anti Inverted
- Anti-Blight
- Anti-Burn
- Anti-Charm
- Anti-Freeze
- Anti-Stun
- Anti-Curse II
- Anti-Dizzy II
- Anti-Exhaust II
- Anti-Stun II

**Complexidade**: Média
**Requerimento**: Sistema de interceptação de aplicação de status

---

### 16. SHADOW E SPECIAL (5 pictos)

#### Shadow Fighter
- **Descrição**: "25% increased damage on enemies with negative Status Effects"
- **Complexidade**: Baixa
- **Requerimento**: Modificador condicional de dano

#### Status Break
- **Descrição**: "Remove all Status Effects on Breaking a target"
- **Complexidade**: Média
- **Requerimento**: Remoção de status em evento específico

#### Dispelling Mark
- **Descrição**: "Marked targets can't gain buffs"
- **Complexidade**: Alta
- **Requerimento**: Bloqueio de aplicação de buffs positivos

#### Element Fusion
- **Descrição**: "Hitting an enemy inflicted with Burning and Frozen applies Blight instead, and those two Status Effects are removed"
- **Complexidade**: Alta
- **Requerimento**: Lógica complexa de transformação de status

#### Critical Shield
- **Descrição**: "On taking a Critical hit, gain 1 Shield"
- **Complexidade**: Média
- **Requerimento**: Detecção de crítico recebido + aplicação de shield

---

### 17. OUTROS (10 pictos)

#### Weak Point Hunter
- **Descrição**: "25% increased Weak Point damage"
- **Complexidade**: Baixa
- **Requerimento**: Modificador de dano de weak point

#### Fragile Enemies
- **Descrição**: "Enemies take 25% more damage, but allies also take 25% more damage"
- **Complexidade**: Média
- **Requerimento**: Modificador global de dano (positivo e negativo)

#### Skill Lover
- **Descrição**: "10% increased Skill damage"
- **Complexidade**: Baixa
- **Requerimento**: Modificador passivo de dano de skills

#### Master Survivor
- **Descrição**: "Survive with 1 Health instead of dying, once per battle"
- **Complexidade**: Média
- **Requerimento**: Prevenção de morte (similar a Survivor)

#### Anti-Anti
- **Descrição**: "Can't be affected by negative Status Effects, but deal 25% less damage"
- **Complexidade**: Alta
- **Requerimento**: Imunidade a status negativos + modificador de dano

#### Gradual Counter
- **Descrição**: "On successful Counter, gain +2.5% of a Gradient Charge"
- **Complexidade**: Alta
- **Requerimento**: Sistema de Counter + Gradient Charge

#### Power From Afar
- **Descrição**: "Deal 10% increased damage for each tile away from target"
- **Complexidade**: Média
- **Requerimento**: Sistema de grid/distância + modificador de dano

#### Close And Personal
- **Descrição**: "Deal 25% increased damage on targets in adjacent tiles"
- **Complexidade**: Média
- **Requerimento**: Sistema de grid/distância + modificador de dano

#### Elemental Specialist
- **Descrição**: Dano aumentado baseado em elemento
- **Complexidade**: Baixa
- **Requerimento**: Modificador de dano por elemento

#### Perfect Defense
- **Descrição**: Defesa perfeita ocasional
- **Complexidade**: Média
- **Requerimento**: Sistema de defesa aprimorado

---

## Categorização por Complexidade

### 🟢 Baixa Complexidade (28 pictos)
Modificadores simples de valores, efeitos diretos.

### 🟡 Média Complexidade (38 pictos)
Requerem rastreamento de eventos, condições múltiplas, interceptação de ações.

### 🔴 Alta Complexidade (33 pictos)
Requerem sistemas complexos como Gradient Charge, manipulação de turnos, buffs empilháveis.

---

## Sistemas Necessários para Implementação

### 1. Sistema de Gradient Charge (15+ pictos)
Sistema completo de acumulação e uso de cargas especiais.

### 2. Sistema de Manipulação de Turnos (7 pictos)
Controle avançado da ordem de iniciativa e ações extras.

### 3. Sistema de Counter Attacks (10 pictos)
Mecânica completa de contra-ataques com modificadores.

### 4. Sistema de Interceptação de Status (14+ pictos)
Capacidade de interceptar e bloquear aplicação de status effects.

### 5. Sistema de Modificadores Passivos (30+ pictos)
Framework para modificadores dinâmicos de dano, crítico, break, etc.

### 6. Sistema de Buffs Empilháveis (5 pictos)
Buffs que acumulam múltiplas vezes com tracking.

### 7. Sistema de Grid/Distância (2 pictos)
Cálculo de distância entre personagens no campo de batalha.

---

## Próximos Passos Recomendados

### Fase 1: Modificadores Simples (Sprint 1-2)
Implementar pictos de complexidade baixa que são modificadores diretos:
- Augmented Attack
- Effective Heal
- Burn Affinity
- Frozen Affinity
- Solo Fighter
- Teamwork

### Fase 2: Modificadores Condicionais (Sprint 3-4)
Implementar pictos que dependem de condições mas não de sistemas novos:
- Sniper
- Versatile
- Critical Break
- Shadow Fighter
- Skill Lover

### Fase 3: Sistemas Intermediários (Sprint 5-8)
- Sistema de Counter Attacks
- Sistema de Interceptação de Status (Anti-Status)
- Sistema de Buffs Empilháveis

### Fase 4: Sistemas Avançados (Sprint 9-12)
- Sistema de Gradient Charge
- Sistema de Manipulação de Turnos
- Sistema de Grid/Distância

---

## Observações Importantes

1. **Priorização**: Focar primeiro em pictos de baixa complexidade que agregam mais valor ao gameplay
2. **Testes**: Cada picto implementado deve ser testado com diferentes cenários de combate
3. **Balanceamento**: Alguns pictos podem precisar de ajustes de valores após implementação
4. **Documentação**: Manter este documento atualizado conforme pictos são implementados
5. **Refatoração**: Sistemas complexos podem exigir refatoração significativa do código de combate atual

---

*Este documento será atualizado conforme novos pictos são implementados.*
