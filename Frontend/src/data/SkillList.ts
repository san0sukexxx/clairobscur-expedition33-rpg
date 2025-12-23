import type { SkillResponse } from "../api/ResponseModel";

export const SkillsList: SkillResponse[] = [
  // ====================
  // GUSTAVE (8 skills)
  // ====================
  {
    id: "gustave-lumiere-assault",
    character: "gustave",
    name: "Lumiere Assault",
    cost: 3,
    unlockCost: 0,
    description: "Causa dano baixo em alvo único usando elemento da arma. 5 acertos. Acertos críticos geram 1 Carga adicional. Habilidade inicial de Gustave.",
    image: "Gustave_LumiereAssault.webp"
  },
  {
    id: "gustave-marking-shot",
    character: "gustave",
    name: "Marking Shot",
    cost: 2,
    unlockCost: 1,
    description: "Causa dano de Raio baixo em alvo único. 1 acerto. Aplica Marcado no alvo, fazendo-o receber +50% de dano.",
    image: "Gustave_MarkingShot.webp",
    preRequisite: ["gustave-overcharge"]
  },
  {
    id: "gustave-overcharge",
    character: "gustave",
    name: "Overcharge",
    cost: 4,
    unlockCost: 0,
    description: "Causa dano de Raio alto baseado na quantidade de Cargas acumuladas. 1 acerto. Pode causar Break. Consome todas as Cargas ao usar. Habilidade inicial de Gustave.",
    image: "Gustave_Overcharge.webp"
  },
  {
    id: "gustave-powerful",
    character: "gustave",
    name: "Powerful",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Fortalecido em 1-3 aliados por 3 turnos, aumentando o dano causado em 25%. Concede 0-2 Cargas aleatoriamente. Requer habilidade Lumiere Assault.",
    image: "Gustave_Powerful.webp",
    preRequisite: ["gustave-lumiere-assault"]
  },
  {
    id: "gustave-recovery",
    character: "gustave",
    name: "Recovery",
    cost: 3,
    unlockCost: 2,
    description: "Restaura 50% da Vida máxima de Gustave e remove todos os efeitos de status negativos. Concede 0-2 Cargas aleatoriamente. Requer habilidade Powerful.",
    image: "Gustave_Recovery.webp",
    preRequisite: ["gustave-powerful"]
  },
  {
    id: "gustave-from-fire",
    character: "gustave",
    name: "From Fire",
    cost: 4,
    unlockCost: 2,
    description: "Causa dano médio em alvo único usando elemento da arma. 3 acertos. Se o alvo estiver Queimando, Gustave se cura em 20% da Vida máxima. Requer habilidade Marking Shot.",
    image: "Gustave_FromFire.webp",
    preRequisite: ["gustave-marking-shot"]
  },
  {
    id: "gustave-shatter",
    character: "gustave",
    name: "Shatter",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano de Raio alto em todos os inimigos. 1 acerto. Pode causar Break. Se causar Break com sucesso, carrega completamente o Overcharge (10 Cargas). Requer habilidade Recovery.",
    image: "Gustave_Shatter.webp",
    preRequisite: ["gustave-recovery"]
  },
  {
    id: "gustave-strike-storm",
    character: "gustave",
    name: "Strike Storm",
    cost: 7,
    unlockCost: 10,
    description: "Causa dano muito alto em alvo único usando elemento da arma. 6 acertos. Acertos críticos geram 2 Cargas adicionais (ao invés de 1). Requer habilidade From Fire.",
    image: "Gustave_StrikeStorm.webp",
    preRequisite: ["gustave-from-fire"]
  },

  // ====================
  // LUNE (25 skills)
  // ====================
  {
    id: "lune-electrify",
    character: "lune",
    name: "Electrify",
    cost: 1,
    unlockCost: 1,
    description: "Deals low single target Lightning damage. 3 hits",
    image: "Lune_Electrify.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-immolation",
    character: "lune",
    name: "Immolation",
    cost: 2,
    unlockCost: 2,
    description: "Deals low single target Fire damage and 3 Burn. 1 hit",
    image: "Lune_Immolation.webp"
  },
  {
    id: "lune-ice-lance",
    character: "lune",
    name: "Ice Lance",
    cost: 4,
    unlockCost: 4,
    description: "Deals medium single target Ice damage that Slows the target. 1 Hit",
    image: "Lune_IceGust.webp"
  },
  {
    id: "lune-earth-rising",
    character: "lune",
    name: "Earth Rising",
    cost: 3,
    unlockCost: 3,
    description: "Deals low Earth damage to all enemies. 1 hit",
    image: "Lune_EarthRising.webp",
    preRequisite: ["lune-ice-lance"]
  },
  {
    id: "lune-thermal-transfer",
    character: "lune",
    name: "Thermal Transfer",
    cost: 2,
    unlockCost: 2,
    description: "Deals low single target Ice damage. 2 hits. Gains 4 AP if target Burning",
    image: "Lune_ThermalTransfer.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-thunderfall",
    character: "lune",
    name: "Thunderfall",
    cost: 5,
    unlockCost: 5,
    description: "Deals medium Lightning damage to random enemies. 2-6 hits",
    image: "Lune_Thunderfall.webp",
    preRequisite: ["lune-immolation"]
  },
  {
    id: "lune-wildfire",
    character: "lune",
    name: "Wildfire",
    cost: 4,
    unlockCost: 4,
    description: "Deals medium Fire damage to all enemies. 1 hit. Applies 3 Burn",
    image: "Lune_Wildfire.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-mayhem",
    character: "lune",
    name: "Mayhem",
    cost: 3,
    unlockCost: 3,
    description: "Consumes all Stains to deal high elemental damage to the target",
    image: "Lune_Mayhem.webp",
    preRequisite: ["lune-electrify","lune-thermal-transfer"]
  },
  {
    id: "lune-elemental-trick",
    character: "lune",
    name: "Elemental Trick",
    cost: 3,
    unlockCost: 3,
    description: "Deals low single target Ice, Fire, Lightning, and Earth damage. 4 hits",
    image: "Lune_ElementalTrick.webp",
    preRequisite: ["lune-mayhem"]
  },
  {
    id: "lune-elemental-genesis",
    character: "lune",
    name: "Elemental Genesis",
    cost: 4,
    unlockCost: 4,
    description: "Deals extreme damage to all enemies. 8 hits",
    image: "Lune_ElementalGenesis.webp",
    preRequisite: ["lune-elemental-trick"]
  },
  {
    id: "lune-crippling-tsunami",
    character: "lune",
    name: "Crippling Tsunami",
    cost: 5,
    unlockCost: 5,
    description: "Deals medium Ice damage to all enemies. 1 hit. Applies Slow for 3 turns",
    image: "Lune_CripplingTsunami.webp",
    preRequisite: ["lune-thermal-transfer"]
  },
  {
    id: "lune-rockslide",
    character: "lune",
    name: "Rockslide",
    cost: 5,
    unlockCost: 5,
    description: "Deals medium single target Earth damage. 2 hits. Can Break",
    image: "Lune_Rockslide.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-crustal-crush",
    character: "lune",
    name: "Crustal Crush",
    cost: 7,
    unlockCost: 7,
    description: "Deals High single target Earth and Break damage. 5 hits",
    image: "Lune_CrustalCrush.webp",
    preRequisite: ["lune-rockslide"]
  },
  {
    id: "lune-healing-light",
    character: "lune",
    name: "Healing Light",
    cost: 3,
    unlockCost: 3,
    description: "Heals the targeted Ally and dispels Status Effects",
    image: "Lune_HealingLight.webp",
    preRequisite: ["lune-ice-lance","lune-immolation"]
  },
  {
    id: "lune-lightning-dance",
    character: "lune",
    name: "Lightning Dance",
    cost: 7,
    unlockCost: 7,
    description: "Deals very high single target Lightning damage. 6 hits",
    image: "Lune_LightningDance.webp",
    preRequisite: ["lune-electrify"]
  },
  {
    id: "lune-storm-caller",
    character: "lune",
    name: "Storm Caller",
    cost: 6,
    unlockCost: 6,
    description: "All enemies receive medium Lightning damage at turn end",
    image: "Lune_StormCaller.webp",
    preRequisite: ["lune-lightning-dance"]
  },
  {
    id: "lune-terraquake",
    character: "lune",
    name: "Terraquake",
    cost: 5,
    unlockCost: 5,
    description: "Deals low Earth damage and Break damage to all enemies every turn",
    image: "Lune_Terraquake.webp",
    preRequisite: ["lune-crustal-crush"]
  },
  {
    id: "lune-typhoon",
    character: "lune",
    name: "Typhoon",
    cost: 8,
    unlockCost: 8,
    description: "On turn start, deals high Ice damage to all enemies and Heals allies",
    image: "Lune_Typhoon.webp",
    preRequisite: ["lune-crippling-tsunami"]
  },
  {
    id: "lune-rebirth",
    character: "lune",
    name: "Rebirth",
    cost: 5,
    unlockCost: 5,
    description: "Revives an ally with 30-70% Health and 2 additional AP",
    image: "Lune_Rebirth.webp",
    preRequisite: ["lune-healing-light"]
  },
  {
    id: "lune-revitalization",
    character: "lune",
    name: "Revitalization",
    cost: 5,
    unlockCost: 5,
    description: "Heals 1-3 allies by 40-60% Health",
    image: "Lune_Revitalization.webp",
    preRequisite: ["lune-rebirth"]
  },
  {
    id: "lune-fire-rage",
    character: "lune",
    name: "Fire Rage",
    cost: 5,
    unlockCost: 5,
    description: "Deals increasingly high Fire damage to all enemies",
    image: "Lune_FireRage.webp",
    preRequisite: ["lune-wildfire"]
  },
  {
    id: "lune-hell",
    character: "lune",
    name: "Hell",
    cost: 9,
    unlockCost: 9,
    description: "Deals very high Fire damage with 5 Burn per hit to all enemies. 2 hits",
    image: "Lune_Hell.webp",
    preRequisite: ["lune-fire-rage"]
  },
  {
    id: "lune-sky-break",
    character: "lune",
    name: "Sky Break",
    cost: 3,
    unlockCost: 3,
    description: "Deals extreme damage to all enemies. 1 hit. Can Break",
    isGradient: true,
    image: "Lune_SkyBreak.webp"
  },
  {
    id: "lune-tree-of-life",
    character: "lune",
    name: "Tree of Life",
    cost: 2,
    unlockCost: 2,
    description: "Cleanses all Status Effects and Heals all allies",
    isGradient: true,
    image: "Lune_TreeOfLife.webp"
  },
  {
    id: "lune-tremor",
    character: "lune",
    name: "Tremor",
    cost: 1,
    unlockCost: 1,
    description: "Deals high Earth damage to all enemies. 1 hit. Removes all enemies' Shields",
    isGradient: true,
    image: "Lune_Tremor.webp"
  },

  // ====================
  // MAELLE (27 skills)
  // ====================
  {
    id: "maelle-offensive-switch",
    character: "maelle",
    name: "Offensive Switch",
    cost: 1,
    unlockCost: 0,
    description: "Causa dano baixo em alvo único usando elemento da arma. 1 acerto. Aplica Indefeso por 3 turnos (inimigos recebem +25% de dano). Muda a postura para Ofensiva. Habilidade inicial de Maelle.",
    image: "Maelle_OffensiveSwitch.webp"
  },
  {
    id: "maelle-mezzo-forte",
    character: "maelle",
    name: "Mezzo Forte",
    cost: 1,
    unlockCost: 4,
    description: "Reaplica a postura atual de Maelle, mantendo suas vantagens táticas. Concede 2-4 PA aleatoriamente. Útil para manter momentum e gerar recursos para combos contínuos.",
    image: "Maelle_MezzoForte.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-percee",
    character: "maelle",
    name: "Percee",
    cost: 5,
    unlockCost: 0,
    description: "Causa dano Físico médio em alvo único. 1 acerto. +50% de dano contra alvos Marcados. Custo: 5 PA (reduzido para 2 PA quando usado da postura Virtuosa). Muda a postura para Defensiva. Habilidade inicial de Maelle.",
    image: "Maelle_Percee.webp"
  },
  {
    id: "maelle-degagement",
    character: "maelle",
    name: "Degagement",
    cost: 2,
    unlockCost: 2,
    description: "Causa dano de Fogo baixo em alvo único. 1 acerto. O alvo fica vulnerável a Fogo por 2 turnos (recebe o dobro de dano de Fogo). Muda a postura para Ofensiva.",
    image: "Maelle_Degagement.webp",
    preRequisite: ["maelle-spark","maelle-guard-down"]
  },
  {
    id: "maelle-guard-up",
    character: "maelle",
    name: "Guard Up",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Escudo em até 3 aliados por 3 turnos (reduz dano recebido, estende duração do Égide). QTE perfeito aplica em toda a equipe, QTE falho aplica em apenas 1 aliado. Muda a postura para Ofensiva.",
    image: "Maelle_GuardUp.webp",
    preRequisite: ["maelle-swift-stride"]
  },
  {
    id: "maelle-swift-stride",
    character: "maelle",
    name: "Swift Stride",
    cost: 3,
    unlockCost: 1,
    description: "Causa dano Físico baixo em alvo único. 1 acerto. Muda para postura Virtuosa se o alvo estiver Queimando. Recupera 0-2 PA aleatoriamente. Melhor usado contra inimigos com Queimadura para ativar transição de postura.",
    image: "Maelle_SwiftStride.webp",
    preRequisite: ["maelle-percee"]
  },
  {
    id: "maelle-guard-down",
    character: "maelle",
    name: "Guard Down",
    cost: 3,
    unlockCost: 4,
    description: "Aplica Indefeso em todos os inimigos por 3 turnos (inimigos recebem +25% de dano). Muda a postura para Ofensiva.",
    image: "Maelle_GuardDown.webp",
    preRequisite: ["maelle-guard-up","maelle-degagement"]
  },
  {
    id: "maelle-egide",
    character: "maelle",
    name: "Egide",
    cost: 3,
    unlockCost: 4,
    description: "Protege aliados recebendo dano no lugar deles por 2 turnos. Se Maelle tiver Escudo (Protected), a duração é estendida em 1 turno. Muda a postura para Defensiva.",
    image: "Maelle_Egide.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-spark",
    character: "maelle",
    name: "Spark",
    cost: 3,
    unlockCost: 1,
    description: "Causa dano de Fogo baixo em alvo único. 1 acerto. Aplica 3 Queimaduras (5 se usado da postura Ofensiva). Muda a postura para Defensiva.",
    image: "Maelle_Spark.webp",
    preRequisite: ["maelle-offensive-switch"]
  },
  {
    id: "maelle-rain-of-fire",
    character: "maelle",
    name: "Rain of Fire",
    cost: 5,
    unlockCost: 4,
    description: "Causa dano de Fogo médio em alvo único. 2 acertos. Aplica 3 Queimaduras por acerto (5 se usado da postura Defensiva). Muda a postura para Ofensiva. Uma das habilidades mais fortes de Maelle no início/meio do jogo.",
    image: "Maelle_RainOfFire.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-combustion",
    character: "maelle",
    name: "Combustion",
    cost: 4,
    unlockCost: 6,
    description: "Causa dano Físico médio em alvo único. 2 acertos. Consome até 10 Queimaduras do alvo para aumentar o dano em 10% por Queimadura consumida. Muda a postura para Ofensiva.",
    image: "Maelle_Combustion.webp",
    preRequisite: ["maelle-rain-of-fire"]
  },
  {
    id: "maelle-fleuret-fury",
    character: "maelle",
    name: "Fleuret Fury",
    cost: 6,
    unlockCost: 2,
    description: "Causa dano Físico alto em alvo único. 3 acertos. Pode causar Break. Muda para Sem Postura, exceto se já estiver em postura Virtuosa (mantém Virtuosa).",
    image: "Maelle_FleuretFury.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-breaking-rules",
    character: "maelle",
    name: "Breaking Rules",
    cost: 3,
    unlockCost: 3,
    description: "Causa dano Físico baixo em alvo único. 2 acertos. Destrói todos os Escudos do alvo. Ganha 1 AP por Escudo destruído. Se o alvo estiver Indefeso, jogue um turno adicional. Muda a postura para Ofensiva.",
    image: "Maelle_BreakingRules.webp",
    preRequisite: ["maelle-fleuret-fury"]
  },
  {
    id: "maelle-fencers-flurry",
    character: "maelle",
    name: "Fencer's Flurry",
    cost: 4,
    unlockCost: 6,
    description: "Causa dano médio em todos os inimigos. 1 acerto. Usa elemento da arma. Aplica Indefeso por 1 turno (inimigos recebem +25% de dano). Muda a postura para Ofensiva.",
    image: "Maelle_FencersFlurry.webp",
    preRequisite: ["maelle-breaking-rules"]
  },
  {
    id: "maelle-phantom-strike",
    character: "maelle",
    name: "Phantom Strike",
    cost: 7,
    unlockCost: 4,
    description: "Causa dano de Vazio muito alto em todos os inimigos. 4 acertos. Fornece +35% de Carga de Gradiente ao usar. Muda a postura para Defensiva. Desbloqueado no Ato III.",
    image: "Maelle_PhantomStrike.webp",
    preRequisite: ["maelle-offensive-switch","maelle-burning-canvas"]
  },
  {
    id: "maelle-burning-canvas",
    character: "maelle",
    name: "Burning Canvas",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano Vazio alto em alvo único. 5 acertos. Aplica 1 Queimadura por acerto. Ganha 10% de dano adicional por Queimadura no alvo. Muda a postura para Ofensiva.",
    image: "Maelle_BurningCanvas.webp",
    preRequisite: ["maelle-phantom-strike","maelle-stendhal"]
  },
  {
    id: "maelle-revenge",
    character: "maelle",
    name: "Revenge",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano de Fogo alto em alvo único. 1 acerto. Dano aumenta proporcionalmente ao número de acertos recebidos desde o último turno de Maelle. Pode causar Break. Muda a postura para Defensiva. Recompensa estilo defensivo/tanque.",
    image: "Maelle_Revenge.webp",
    preRequisite: ["maelle-combustion"]
  },
  {
    id: "maelle-pyrolyse",
    character: "maelle",
    name: "Pyrolyse",
    cost: 9,
    unlockCost: 8,
    description: "Causa dano de Fogo extremo em alvo único. 3 acertos. Aplica 5 Queimaduras por acerto (7 se usado da postura Ofensiva). Muda a postura para Defensiva. Total: 15-21 Queimaduras dependendo da postura.",
    image: "Maelle_Pyrolyse.webp",
    preRequisite: ["maelle-revenge"]
  },
  {
    id: "maelle-last-chance",
    character: "maelle",
    name: "Last Chance",
    cost: 1,
    unlockCost: 6,
    description: "Reduz a Vida própria para 1, mas recarrega todos os PA (Pontos de Ação) para o máximo. Muda a postura para Virtuosa. Útil para combos devastadores, mas deixa Maelle extremamente vulnerável.",
    image: "Maelle_LastChance.webp",
    preRequisite: ["maelle-mezzo-forte"]
  },
  {
    id: "maelle-momentum-strike",
    character: "maelle",
    name: "Momentum Strike",
    cost: 7,
    unlockCost: 6,
    description: "Causa dano alto em alvo único usando elemento da arma. 1 acerto. +50% de dano contra alvos Marcados. Custo: 7 PA (reduzido para 4 PA quando usado da postura Virtuosa). Muda a postura para Defensiva.",
    image: "Maelle_MomentumStrike.webp",
    preRequisite: ["maelle-egide"]
  },
  {
    id: "maelle-payback",
    character: "maelle",
    name: "Payback",
    cost: 9,
    unlockCost: 8,
    description: "Causa dano Físico muito alto em alvo único. 1 acerto. Dano aumenta por acertos recebidos desde o último turno. Custo de PA reduzido em 1 para cada ataque aparado com sucesso. Pode causar Break. Muda a postura para Defensiva.",
    image: "Maelle_Payback.webp",
    preRequisite: ["maelle-last-chance","maelle-momentum-strike"]
  },
  {
    id: "maelle-stendhal",
    character: "maelle",
    name: "Stendhal",
    cost: 8,
    unlockCost: 4,
    description: "Causa dano de Vazio extremo em alvo único. 1 acerto. Remove Escudos próprios e aplica Indefeso em si mesma. Muda para Sem Postura. Alto risco, alto dano - uma das skills de maior dano único do jogo com Luminas corretas. Desbloqueado no Ato III.",
    image: "Maelle_Stendhal.webp",
    preRequisite: ["maelle-percee","maelle-burning-canvas"]
  },
  {
    id: "maelle-sword-ballet",
    character: "maelle",
    name: "Sword Ballet",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano extremo em alvo único usando elemento da arma. 5 acertos. Acertos críticos causam o dobro do dano (4x total ao invés de 2x). Muda a postura para Defensiva. Muito eficaz no início/meio do jogo.",
    image: "Maelle_SwordBallet.webp",
    preRequisite: ["maelle-fencers-flurry"]
  },
  {
    id: "maelle-gustaves-homage",
    character: "maelle",
    name: "Gustave's Homage",
    cost: 8,
    unlockCost: 8,
    description: "Causa dano de Raio alto em alvo único. 8 acertos. +50% de dano contra alvos Marcados (não remove a Marca). Muda a postura para Virtuosa. Desbloqueado através do diário de Gustave.",
    image: "Maelle_SpoilerSkill.webp"
  },
  {
    id: "maelle-virtuose-strike",
    character: "maelle",
    name: "Virtuose Strike",
    cost: 1,
    unlockCost: 0,
    description: "Habilidade Gradiente. Causa dano Físico alto em alvo único. 5 acertos. Muda a postura para Virtuosa. Não consome um turno. Útil para transição de postura sem sacrificar economia de ações. Desbloqueado automaticamente ao aprender Ataques Gradiente.",
    isGradient: true,
    masterUnlock: true,
    image: "Maelle_VirtuoseStrike.webp"
  },
  {
    id: "maelle-gommage",
    character: "maelle",
    name: "Gommage",
    cost: 3,
    unlockCost: 3,
    description: "Habilidade Gradiente. Executa instantaneamente alvos com 25% ou menos de HP. Caso contrário, causa dano de Vazio extremo. 1 acerto. Muda a postura para Virtuosa. Requer Nível de Relacionamento 7.",
    isGradient: true,
    masterUnlock: true,
    image: "Maelle_SpoilerGradientAttack.webp"
  },
  {
    id: "maelle-phoenix-flame",
    character: "maelle",
    name: "Phoenix Flame",
    cost: 2,
    unlockCost: 0,
    description: "Habilidade Gradiente. Aplica 10 Queimaduras em todos os inimigos e revive todos os aliados com 50-70% de Vida. Muda a postura para Ofensiva. Não consome um turno. Requer Nível de Relacionamento 4 com Maelle.",
    isGradient: true,
    masterUnlock: true,
    image: "Maelle_PhoenixFlame.webp"
  },

  // ====================
  // SCIEL (26 skills)
  // ====================
  {
    id: "sciel-twilight-slash",
    character: "sciel",
    name: "Twilight Slash",
    cost: 2,
    unlockCost: 0,
    description: "Causa dano das Trevas baixo em alvo único. 1 acerto. Consome todos os Foretell para aumentar o dano. Habilidade inicial de Sciel.",
    type: "moon",
    image: "Sciel_TwilightSlash.webp"
  },
  {
    id: "sciel-focused-foretell",
    character: "sciel",
    name: "Focused Foretell",
    cost: 2,
    unlockCost: 0,
    description: "Causa dano Físico médio em alvo único. 1 acerto. Aplica 2-5 Foretell dependendo do estado do alvo. Habilidade inicial de Sciel.",
    image: "Sciel_FocusedForetell.webp"
  },
  {
    id: "sciel-bad-omen",
    character: "sciel",
    name: "Bad Omen",
    cost: 3,
    unlockCost: 4,
    description: "Causa dano das Trevas baixo em todos os inimigos. 2 acertos. Aplica 2 Foretell por acerto. Requer habilidade Marking Card.",
    type: "moon",
    image: "Sciel_BadOmen.webp",
    preRequisite: ["sciel-marking-card"]
  },
  {
    id: "sciel-marking-card",
    character: "sciel",
    name: "Marking Card",
    cost: 3,
    unlockCost: 2,
    description: "Causa dano das Trevas médio em alvo único. 2 acertos. Aplica Marcado e 3 Foretell. Requer habilidade Focused Foretell.",
    type: "moon",
    image: "Sciel_MarkingCard.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-delaying-slash",
    character: "sciel",
    name: "Delaying Slash",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano médio em alvo único. 2 acertos. Consome Foretell para aumentar o dano e atrasar o alvo na ordem de turno. Requer habilidade Bad Omen.",
    image: "Sciel_DelayingSlash.webp",
    preRequisite: ["sciel-bad-omen"]
  },
  {
    id: "sciel-dark-cleansing",
    character: "sciel",
    name: "Dark Cleansing",
    cost: 0,
    unlockCost: 2,
    description: "Remove todos os efeitos de status negativos de um aliado. Propaga os buffs do alvo para todos os aliados. Requer habilidade Spectral Sweep.",
    type: "moon",
    image: "Sciel_DarkCleansing.webp",
    preRequisite: ["sciel-spectral-sweep"]
  },
  {
    id: "sciel-dark-wave",
    character: "sciel",
    name: "Dark Wave",
    cost: 6,
    unlockCost: 10,
    description: "Causa dano das Trevas alto em todos os inimigos. 3 acertos. Consome Foretell para aumentar o dano. Requer habilidades Grim Harvest ou Delaying Slash.",
    type: "moon",
    image: "Sciel_DarkWave.webp",
    preRequisite: ["sciel-grim-harvest","sciel-delaying-slash"]
  },
  {
    id: "sciel-grim-harvest",
    character: "sciel",
    name: "Grim Harvest",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano das Trevas médio em alvo único. 1 acerto. Cura todos os aliados em 30% da Vida máxima. Foretell aumenta a cura. Requer habilidade Sealed Fate.",
    type: "moon",
    image: "Sciel_GrimHarvest.webp",
    preRequisite: ["sciel-sealed-fate"]
  },
  {
    id: "sciel-harvest",
    character: "sciel",
    name: "Harvest",
    cost: 3,
    unlockCost: 1,
    description: "Causa dano médio em alvo único. 1 acerto. Cura Sciel em 40% da Vida máxima. Consome Foretell para aumentar a cura. Requer habilidade Twilight Slash.",
    image: "Sciel_Harvest.webp",
    preRequisite: ["sciel-twilight-slash"]
  },
  {
    id: "sciel-searing-bond",
    character: "sciel",
    name: "Searing Bond",
    cost: 4,
    unlockCost: 2,
    description: "Causa dano das Trevas médio em alvo único. 1 acerto. Aplica 5 Foretell. Efeito adicional contra inimigos Queimando. Requer habilidade Harvest.",
    type: "moon",
    image: "Sciel_SearingBond.webp",
    preRequisite: ["sciel-harvest"]
  },
  {
    id: "sciel-phantom-blade",
    character: "sciel",
    name: "Phantom Blade",
    cost: 5,
    unlockCost: 2,
    description: "Causa dano das Trevas alto em alvo único. 1 acerto. Consome todos os Foretell para aumentar o dano. Pode causar Break. Requer habilidade Twilight Slash.",
    type: "moon",
    image: "Sciel_PhantomBlade.webp",
    preRequisite: ["sciel-twilight-slash"]
  },
  {
    id: "sciel-sealed-fate",
    character: "sciel",
    name: "Sealed Fate",
    cost: 4,
    unlockCost: 4,
    description: "Causa dano alto em alvo único. 5-7 acertos. Cada acerto consome 1 Foretell para 200% de dano adicional. Requer habilidade Phantom Blade.",
    image: "Sciel_SealedFate.webp",
    preRequisite: ["sciel-phantom-blade"]
  },
  {
    id: "sciel-spectral-sweep",
    character: "sciel",
    name: "Spectral Sweep",
    cost: 7,
    unlockCost: 2,
    description: "Causa dano médio em alvo único. 2-6 acertos. Aplica 1 Foretell por acerto. Acertos críticos concedem Foretell adicional. Requer habilidade Rush.",
    image: "Sciel_SpectralSweep.webp",
    preRequisite: ["sciel-rush"]
  },
  {
    id: "sciel-firing-shadow",
    character: "sciel",
    name: "Firing Shadow",
    cost: 3,
    unlockCost: 2,
    description: "Causa dano das Trevas baixo em todos os inimigos. 3 acertos. Consome 1 Foretell por acerto para aumentar o dano. Requer habilidade Searing Bond.",
    type: "moon",
    image: "Sciel_FiringShadow.webp",
    preRequisite: ["sciel-searing-bond"]
  },
  {
    id: "sciel-fortunes-fury",
    character: "sciel",
    name: "Fortune's Fury",
    cost: 5,
    unlockCost: 6,
    description: "Um aliado alvo causa o dobro de dano durante 1 turno completo. Requer habilidade Firing Shadow.",
    image: "Sciel_FortunesFury.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-our-sacrifice",
    character: "sciel",
    name: "Our Sacrifice",
    cost: 4,
    unlockCost: 8,
    description: "Causa dano das Trevas extremo em todos os inimigos. 1 acerto. Absorve Vida de aliados e Foretell de inimigos. Requer habilidade Fortune's Fury.",
    type: "moon",
    image: "Sciel_OurSacrifice.webp",
    preRequisite: ["sciel-fortunes-fury"]
  },
  {
    id: "sciel-plentiful-harvest",
    character: "sciel",
    name: "Plentiful Harvest",
    cost: 4,
    unlockCost: 4,
    description: "Causa dano Físico médio em alvo único. 2 acertos. Converte Foretell em PA distribuídos entre aliados. Requer habilidade Firing Shadow.",
    image: "Sciel_PlentifulHarvest.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-rush",
    character: "sciel",
    name: "Rush",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Rapidez em 1-3 aliados por 3 turnos, aumentando a Velocidade em 33%. Requer habilidade Focused Foretell.",
    image: "Sciel_Rush.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-all-set",
    character: "sciel",
    name: "All Set",
    cost: 3,
    unlockCost: 6,
    description: "Aplica Escudo, Fortalecido e Rapidez em todos os aliados. Combinação poderosa de buffs defensivos e ofensivos. Requer habilidade Card Weaver.",
    image: "Sciel_AllSet.webp",
    preRequisite: ["sciel-card-weaver"]
  },
  {
    id: "sciel-intervention",
    character: "sciel",
    name: "Intervention",
    cost: 5,
    unlockCost: 6,
    description: "Um aliado alvo joga imediatamente e ganha 4 PA. Excelente para combos e situações de emergência. Requer habilidade Dark Cleansing.",
    image: "Sciel_Intervention.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-card-weaver",
    character: "sciel",
    name: "Card Weaver",
    cost: 3,
    unlockCost: 4,
    description: "Causa dano Físico baixo em alvo único. 1 acerto. Propaga o Foretell do alvo para todos os inimigos. Requer habilidade Dark Cleansing.",
    image: "Sciel_CardWeaver.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-final-path",
    character: "sciel",
    name: "Final Path",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano das Trevas extremo em alvo único. 1 acerto. Aplica 10 Foretell. Pode causar Break. Requer habilidade Dark Wave.",
    type: "moon",
    image: "Sciel_FinalPath.webp",
    isBlocked: true,
    preRequisite: ["sciel-dark-wave"]
  },
  {
    id: "sciel-twilight-dance",
    character: "sciel",
    name: "Twilight Dance",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano das Trevas extremo em alvo único. 4 acertos. Estende a duração do Crepúsculo em 1 turno. Consome Foretell. Requer habilidades Final Path, All Set ou Our Sacrifice.",
    type: "moon",
    image: "Sciel_TwilightDance.webp",
    preRequisite: ["sciel-final-path","sciel-all-set","sciel-our-sacrifice"]
  },
  {
    id: "sciel-shadow-bringer",
    character: "sciel",
    name: "Shadow Bringer",
    cost: 1,
    unlockCost: 0,
    description: "Habilidade Gradiente. Causa dano das Trevas alto em inimigos aleatórios. 10 acertos. Aplica 1 Foretell por acerto. Desbloqueado automaticamente ao aprender Ataques Gradiente.",
    isGradient: true,
    masterUnlock: true,
    type: "moon",
    image: "Sciel_ShadowBringer.webp"
  },
  {
    id: "sciel-doom",
    character: "sciel",
    name: "Doom",
    cost: 2,
    unlockCost: 0,
    description: "Habilidade Gradiente. Causa dano das Trevas muito alto em alvo único. 3 acertos. Aplica Fraco, Indefeso e Lento por 3 turnos. Pode causar Break. Requer Nível de Relacionamento 4 com Sciel.",
    isGradient: true,
    masterUnlock: true,
    type: "moon",
    image: "Sciel_Doom.webp"
  },
  {
    id: "sciel-end-slice",
    character: "sciel",
    name: "End Slice",
    cost: 3,
    unlockCost: 0,
    description: "Habilidade Gradiente. Causa dano Físico extremo em alvo único. 1 acerto. O dano escala com a quantidade de Foretell consumido. Requer Nível de Relacionamento 7 com Sciel.",
    isGradient: true,
    masterUnlock: true,
    image: "Sciel_EndSlice.webp"
  },

  // ====================
  // VERSO (27 skills)
  // ====================
  {
    id: "verso-angels-eyes",
    character: "verso",
    name: "Angel's Eyes",
    cost: 3,
    unlockCost: 3,
    description: "Gradient skill. Deals damage with enhanced effects.",
    isGradient: true,
    image: "Verso_AngelsEyes.webp"
  },
  {
    id: "verso-ascending-assault",
    character: "verso",
    name: "Ascending Assault",
    cost: 3,
    unlockCost: 3,
    description: "Multi-hit assault with ascending damage.",
    image: "Verso_AscendingAssault.webp"
  },
  {
    id: "verso-assault-zero",
    character: "verso",
    name: "Assault Zero",
    cost: 3,
    unlockCost: 3,
    description: "Initial assault skill.",
    image: "Verso_AssaultZero.webp"
  },
  {
    id: "verso-berserk-slash",
    character: "verso",
    name: "Berserk Slash",
    cost: 3,
    unlockCost: 3,
    description: "Powerful slash with berserk damage.",
    image: "Verso_BerserkSlash.webp"
  },
  {
    id: "verso-blitz",
    character: "verso",
    name: "Blitz",
    cost: 3,
    unlockCost: 3,
    description: "Fast lightning attack.",
    image: "Verso_Blitz.webp"
  },
  {
    id: "verso-burden",
    character: "verso",
    name: "Burden",
    cost: 3,
    unlockCost: 3,
    description: "Applies burden debuff to enemies.",
    image: "Verso_Burden.webp"
  },
  {
    id: "verso-defiant-strike",
    character: "verso",
    name: "Defiant Strike",
    cost: 3,
    unlockCost: 3,
    description: "Defiant counter-attack strike.",
    image: "Verso_DefiantStrike.webp"
  },
  {
    id: "verso-endbringer",
    character: "verso",
    name: "Endbringer",
    cost: 3,
    unlockCost: 3,
    description: "Ultimate finisher skill.",
    image: "Verso_Endbringer.webp"
  },
  {
    id: "verso-followup",
    character: "verso",
    name: "Follow Up",
    cost: 3,
    unlockCost: 3,
    description: "Follow-up attack after ally action.",
    image: "Verso_Followup.webp"
  },
  {
    id: "verso-from-fire",
    character: "verso",
    name: "From Fire",
    cost: 3,
    unlockCost: 3,
    description: "Fire-based attack skill.",
    image: "Verso_FromFire.webp"
  },
  {
    id: "verso-leadership",
    character: "verso",
    name: "Leadership",
    cost: 3,
    unlockCost: 3,
    description: "Buffs allies with leadership.",
    image: "Verso_Leadership.webp"
  },
  {
    id: "verso-light-holder",
    character: "verso",
    name: "Light Holder",
    cost: 3,
    unlockCost: 3,
    description: "Holds and channels light energy.",
    image: "Verso_LightHolder.webp"
  },
  {
    id: "verso-marking-shot",
    character: "verso",
    name: "Marking Shot",
    cost: 3,
    unlockCost: 3,
    description: "Applies mark to target.",
    image: "Verso_MarkingShot.webp"
  },
  {
    id: "verso-overload",
    character: "verso",
    name: "Overload",
    cost: 3,
    unlockCost: 3,
    description: "Overcharged powerful attack.",
    image: "Verso_Overload.webp"
  },
  {
    id: "verso-paradigm-shift",
    character: "verso",
    name: "Paradigm Shift",
    cost: 3,
    unlockCost: 3,
    description: "Changes battle paradigm and enhances abilities.",
    image: "Verso_ParadigmShift.webp"
  },
  {
    id: "verso-perfect-break",
    character: "verso",
    name: "Perfect Break",
    cost: 3,
    unlockCost: 3,
    description: "Perfect timing break skill.",
    image: "Verso_PerfectBreak.webp"
  },
  {
    id: "verso-perfect-recovery",
    character: "verso",
    name: "Perfect Recovery",
    cost: 3,
    unlockCost: 3,
    description: "Perfect healing skill.",
    image: "Verso_PerfectRecovery.webp"
  },
  {
    id: "verso-phantom-stars",
    character: "verso",
    name: "Phantom Stars",
    cost: 3,
    unlockCost: 3,
    description: "Summons phantom stars for damage.",
    image: "Verso_PhantomStars.webp"
  },
  {
    id: "verso-powerful",
    character: "verso",
    name: "Powerful",
    cost: 3,
    unlockCost: 3,
    description: "Applies Powerful buff.",
    image: "Verso_Powerful.webp"
  },
  {
    id: "verso-purification",
    character: "verso",
    name: "Purification",
    cost: 3,
    unlockCost: 3,
    description: "Purifies and cleanses allies.",
    image: "Verso_Purification.webp"
  },
  {
    id: "verso-quick-strike",
    character: "verso",
    name: "Quick Strike",
    cost: 3,
    unlockCost: 3,
    description: "Fast quick strike attack.",
    image: "Verso_QuickStrike.webp"
  },
  {
    id: "verso-radiant-slash",
    character: "verso",
    name: "Radiant Slash",
    cost: 3,
    unlockCost: 3,
    description: "Radiant light-based slash.",
    image: "Verso_RadiantSlash.webp"
  },
  {
    id: "verso-sabotage",
    character: "verso",
    name: "Sabotage",
    cost: 3,
    unlockCost: 3,
    description: "Sabotages enemy abilities.",
    image: "Verso_Sabotage.webp"
  },
  {
    id: "verso-speedburst",
    character: "verso",
    name: "Speed Burst",
    cost: 3,
    unlockCost: 3,
    description: "Burst of speed for rapid attacks.",
    image: "Verso_Speedburst.webp"
  },
  {
    id: "verso-steeled-strike",
    character: "verso",
    name: "Steeled Strike",
    cost: 3,
    unlockCost: 3,
    description: "Strong steel-reinforced strike.",
    image: "Verso_SteeledStrike.webp"
  },
  {
    id: "verso-striker",
    character: "verso",
    name: "Striker",
    cost: 3,
    unlockCost: 3,
    description: "Basic striker attack.",
    image: "Verso_Striker.webp"
  },
  {
    id: "verso-strike-storm",
    character: "verso",
    name: "Strike Storm",
    cost: 3,
    unlockCost: 3,
    description: "Storm of multiple strikes.",
    image: "Verso_Strikestorm.webp"
  },

  // ====================
  // MONOCO (48 skills)
  // ====================
  {
    id: "monoco-abbest-wind",
    character: "monoco",
    name: "Abbest Wind",
    cost: 3,
    description: "Wind-based attack.",
    image: "Monoco_AbbestWind.webp"
  },
  {
    id: "monoco-aberration-light",
    character: "monoco",
    name: "Aberration Light",
    cost: 3,
    description: "Aberrant light attack.",
    image: "Monoco_AberrationLight.webp"
  },
  {
    id: "monoco-ballet-charm",
    character: "monoco",
    name: "Ballet Charm",
    cost: 3,
    description: "Charming ballet-style attack.",
    image: "Monoco_BalletCharm.webp"
  },
  {
    id: "monoco-benisseur-mortar",
    character: "monoco",
    name: "Benisseur Mortar",
    cost: 3,
    description: "Mortar bombardment attack.",
    image: "Monoco_BenisseurMortar.webp"
  },
  {
    id: "monoco-boucheclier-fortify",
    character: "monoco",
    name: "Boucheclier Fortify",
    cost: 3,
    description: "Shield fortification skill.",
    image: "Monoco_BoucheclierFortify.webp"
  },
  {
    id: "monoco-braseleur-smash",
    character: "monoco",
    name: "Braseleur Smash",
    cost: 3,
    description: "Powerful smashing attack.",
    image: "Monoco_BraseleurSmash.webp"
  },
  {
    id: "monoco-break-point",
    character: "monoco",
    name: "Break Point",
    cost: 3,
    description: "Critical break point attack.",
    image: "Monoco_BreakPoint.webp"
  },
  {
    id: "monoco-bruler-bash",
    character: "monoco",
    name: "Bruler Bash",
    cost: 3,
    description: "Burning bash attack.",
    image: "Monoco_BrulerBash.webp"
  },
  {
    id: "monoco-chalier-combo",
    character: "monoco",
    name: "Chalier Combo",
    cost: 3,
    description: "Multi-hit combo attack.",
    image: "Monoco_ChalierCombo.webp"
  },
  {
    id: "monoco-chapelier-slash",
    character: "monoco",
    name: "Chapelier Slash",
    cost: 3,
    description: "Slashing attack.",
    image: "Monoco_ChapelierSlash.webp"
  },
  {
    id: "monoco-chevaliere-ice",
    character: "monoco",
    name: "Chevaliere Ice",
    cost: 3,
    description: "Ice-based knight attack.",
    image: "Monoco_ChevaliereIce.webp"
  },
  {
    id: "monoco-chevaliere-piercing",
    character: "monoco",
    name: "Chevaliere Piercing",
    cost: 3,
    description: "Piercing knight attack.",
    image: "Monoco_ChevalierePiercing.webp"
  },
  {
    id: "monoco-chevaliere-thrusts",
    character: "monoco",
    name: "Chevaliere Thrusts",
    cost: 3,
    description: "Multiple thrusting attacks.",
    image: "Monoco_ChevaliereThrusts.webp"
  },
  {
    id: "monoco-clair-enfeeble",
    character: "monoco",
    name: "Clair Enfeeble",
    cost: 3,
    description: "Enfeebling light attack.",
    image: "Monoco_ClairEnfeeble.webp"
  },
  {
    id: "monoco-contorsionniste-blast",
    character: "monoco",
    name: "Contorsionniste Blast",
    cost: 3,
    description: "Contortionist explosive blast.",
    image: "Monoco_ContorsionnisteBlast.webp"
  },
  {
    id: "monoco-creation-void",
    character: "monoco",
    name: "Creation Void",
    cost: 3,
    description: "Creates void energy.",
    image: "Monoco_CreationVoid.webp"
  },
  {
    id: "monoco-cruler-barrier",
    character: "monoco",
    name: "Cruler Barrier",
    cost: 3,
    description: "Protective barrier skill.",
    image: "Monoco_CrulerBarrier.webp"
  },
  {
    id: "monoco-cultist-blood",
    character: "monoco",
    name: "Cultist Blood",
    cost: 3,
    description: "Blood-based cultist attack.",
    image: "Monoco_CultistBlood.webp"
  },
  {
    id: "monoco-cultist-slashes",
    character: "monoco",
    name: "Cultist Slashes",
    cost: 3,
    description: "Multiple cultist slashing attacks.",
    image: "Monoco_CultistSlashes.webp"
  },
  {
    id: "monoco-danseuse-waltz",
    character: "monoco",
    name: "Danseuse Waltz",
    cost: 3,
    description: "Graceful waltzing attack.",
    image: "Monoco_DanseuseWaltz.webp"
  },
  {
    id: "monoco-demineur-thunder",
    character: "monoco",
    name: "Demineur Thunder",
    cost: 3,
    description: "Thunder-based explosive attack.",
    image: "Monoco_DemineurThunder.webp"
  },
  {
    id: "monoco-duallist-storm",
    character: "monoco",
    name: "Duallist Storm",
    cost: 3,
    description: "Dual-wielding storm attack.",
    image: "Monoco_DuallistStorm.webp"
  },
  {
    id: "monoco-echassier-stabs",
    character: "monoco",
    name: "Echassier Stabs",
    cost: 3,
    description: "Multiple stabbing attacks.",
    image: "Monoco_EchassierStabs.webp"
  },
  {
    id: "monoco-eveque-spear",
    character: "monoco",
    name: "Eveque Spear",
    cost: 3,
    description: "Bishop's spear attack.",
    image: "Monoco_EvequeSpear.webp"
  },
  {
    id: "monoco-gault-fury",
    character: "monoco",
    name: "Gault Fury",
    cost: 3,
    description: "Furious rage attack.",
    image: "Monoco_GaultFury.webp"
  },
  {
    id: "monoco-glaise-earthquakes",
    character: "monoco",
    name: "Glaise Earthquakes",
    cost: 3,
    description: "Earth-shaking earthquake attack.",
    image: "Monoco_GlaiseEarthquakes.webp"
  },
  {
    id: "monoco-hexga-crush",
    character: "monoco",
    name: "Hexga Crush",
    cost: 3,
    description: "Crushing hex attack.",
    image: "Monoco_HexgaCrush.webp"
  },
  {
    id: "monoco-jar-lampstorm",
    character: "monoco",
    name: "Jar Lampstorm",
    cost: 3,
    description: "Lamp jar storm attack.",
    image: "Monoco_JarLampstorm.webp"
  },
  {
    id: "monoco-lampmaster-light",
    character: "monoco",
    name: "Lampmaster Light",
    cost: 3,
    description: "Master lamp light attack.",
    image: "Monoco_LampmasterLight.webp"
  },
  {
    id: "monoco-lancelier-impale",
    character: "monoco",
    name: "Lancelier Impale",
    cost: 3,
    description: "Impaling lance attack.",
    image: "Monoco_LancelierImpale.webp"
  },
  {
    id: "monoco-luster-slices",
    character: "monoco",
    name: "Luster Slices",
    cost: 3,
    description: "Lustrous slicing attacks.",
    image: "Monoco_LusterSlices.webp"
  },
  {
    id: "monoco-mighty-strike",
    character: "monoco",
    name: "Mighty Strike",
    cost: 3,
    description: "Powerful mighty strike.",
    image: "Monoco_MightyStrike.webp"
  },
  {
    id: "monoco-moissonneuse-vendange",
    character: "monoco",
    name: "Moissonneuse Vendange",
    cost: 3,
    description: "Harvesting reaper attack.",
    image: "Monoco_MoissonneuseVendange.webp"
  },
  {
    id: "monoco-obscur-sword",
    character: "monoco",
    name: "Obscur Sword",
    cost: 3,
    description: "Dark shadow sword attack.",
    image: "Monoco_ObscurSword.webp"
  },
  {
    id: "monoco-orphelin-cheers",
    character: "monoco",
    name: "Orphelin Cheers",
    cost: 3,
    description: "Orphan's cheerful buff.",
    image: "Monoco_OrphelinCheers.webp"
  },
  {
    id: "monoco-pelerin-heal",
    character: "monoco",
    name: "Pelerin Heal",
    cost: 3,
    description: "Pilgrim's healing skill.",
    image: "Monoco_PelerinHeal.webp"
  },
  {
    id: "monoco-portier-crash",
    character: "monoco",
    name: "Portier Crash",
    cost: 3,
    description: "Door-breaking crash attack.",
    image: "Monoco_PortierCrash.webp"
  },
  {
    id: "monoco-potier-energy",
    character: "monoco",
    name: "Potier Energy",
    cost: 3,
    description: "Potter's energy skill.",
    image: "Monoco_PotierEnergy.webp"
  },
  {
    id: "monoco-ramasseur-bonk",
    character: "monoco",
    name: "Ramasseur Bonk",
    cost: 3,
    description: "Collector's bonking attack.",
    image: "Monoco_RamasseurBonk.webp"
  },
  {
    id: "monoco-rocher-hammering",
    character: "monoco",
    name: "Rocher Hammering",
    cost: 3,
    description: "Rock hammering attack.",
    image: "Monoco_RocherHammering.webp"
  },
  {
    id: "monoco-sakapatate-estoc",
    character: "monoco",
    name: "Sakapatate Estoc",
    cost: 3,
    description: "Estoc thrusting attack.",
    image: "Monoco_SakapatateEstoc.webp"
  },
  {
    id: "monoco-sakapatate-explosion",
    character: "monoco",
    name: "Sakapatate Explosion",
    cost: 3,
    description: "Explosive attack.",
    image: "Monoco_SakapatateExplosion.webp"
  },
  {
    id: "monoco-sakapatate-fire",
    character: "monoco",
    name: "Sakapatate Fire",
    cost: 3,
    description: "Fire-based attack.",
    image: "Monoco_SakapatateFire.webp"
  },
  {
    id: "monoco-sakapatate-slam",
    character: "monoco",
    name: "Sakapatate Slam",
    cost: 3,
    description: "Powerful slamming attack.",
    image: "Monoco_SakapatateSlam.webp"
  },
  {
    id: "monoco-sanctuary",
    character: "monoco",
    name: "Sanctuary",
    cost: 3,
    description: "Creates protective sanctuary.",
    image: "Monoco_Sanctuary.webp"
  },
  {
    id: "monoco-sapling-absorption",
    character: "monoco",
    name: "Sapling Absorption",
    cost: 3,
    description: "Absorbs energy like a sapling.",
    image: "Monoco_SaplingAbsorption.webp"
  },
  {
    id: "monoco-stalact-punches",
    character: "monoco",
    name: "Stalact Punches",
    cost: 3,
    description: "Stalactite-like punching attacks.",
    image: "Monoco_StalactPunches.webp"
  },
  {
    id: "monoco-troubadour-trumpet",
    character: "monoco",
    name: "Troubadour Trumpet",
    cost: 3,
    description: "Trumpet sound attack.",
    image: "Monoco_TroubadourTrumpet.webp"
  }
];
