import type { SkillResponse } from "../api/ResponseModel";

export const SkillsList: SkillResponse[] = [
  // ====================
  // GUSTAVE (8 skills)
  // ====================
  {
    id: "gustave-lumiere-assault",
    character: "gustave",
    name: "Assalto Luimièriano",
    cost: 3,
    unlockCost: 0,
    description: "Causa dano baixo em alvo único. 5 acertos. Usa elemento da arma. Acertos críticos geram 1 Carga adicional.",
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
    name: "Sobrecarga",
    cost: 4,
    unlockCost: 0,
    description: "Causa dano de Raio alto baseado na quantidade de Cargas. 1 acerto. Pode causar quebra.",
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
    description: "Causa dano de Raio alto em todos os inimigos. 1 acerto. Pode causar quebra. Se um alvo sofrer Break pelo acerto, Overcharge é totalmente carregado.",
    image: "Gustave_Shatter.webp",
    preRequisite: ["gustave-recovery"]
  },
  {
    id: "gustave-strike-storm",
    character: "gustave",
    name: "Strike Storm",
    cost: 7,
    unlockCost: 10,
    description: "Causa dano muito alto em alvo único. 6 acertos. Usa elemento da arma. Acertos críticos geram 2 Cargas adicionais.",
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
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano baixo de Raio a um único alvo. 3 acertos.\n\nConsome Fogo para gerar uma Mancha de Luz. Acertos críticos adicionam um acerto extra.\n\nUsar esta habilidade concede 1 Mancha de Raio e 1 Mancha de Luz.",
    image: "Lune_Electrify.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-immolation",
    character: "lune",
    name: "Immolation",
    cost: 2,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano baixo de Fogo a um único alvo e 3 Queimaduras. 1 acerto.\n\nConsome Gelo para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Fogo e 1 Mancha de Luz.",
    image: "Lune_Immolation.webp"
  },
  {
    id: "lune-ice-lance",
    character: "lune",
    name: "Ice Lance",
    cost: 4,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano médio de Gelo a um único alvo e Desacelera o alvo. 1 acerto.\n\nConsome Terra para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Gelo e 1 Mancha de Luz.",
    image: "Lune_IceGust.webp"
  },
  {
    id: "lune-earth-rising",
    character: "lune",
    name: "Earth Rising",
    cost: 3,
    unlockCost: 1,
    description: "Efeito da Habilidade: Causa dano baixo de Terra a todos os inimigos. 1 acerto.\n\nConsome Raio para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Terra e 1 Mancha de Luz.",
    image: "Lune_EarthRising.webp",
    preRequisite: ["lune-ice-lance"]
  },
  {
    id: "lune-thermal-transfer",
    character: "lune",
    name: "Thermal Transfer",
    cost: 2,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano baixo de Gelo a um único alvo. 2 acertos. Ganha 4 PM se o alvo estiver Queimando.\n\nConsome 2 Manchas de Terra para jogar um segundo turno.\n\nUsar esta habilidade concede 1 Mancha de Gelo e 1 Mancha de Luz.",
    image: "Lune_ThermalTransfer.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-thunderfall",
    character: "lune",
    name: "Thunderfall",
    cost: 5,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano médio de Raio em inimigos aleatórios. 2-6 acertos.\n\nConsome Fogo para causar dano aumentado. Acertos críticos adicionam um acerto extra.\n\nUsar esta habilidade concede 1 Mancha de Raio e 1 Mancha de Luz.",
    image: "Lune_Thunderfall.webp",
    preRequisite: ["lune-immolation"]
  },
  {
    id: "lune-wildfire",
    character: "lune",
    name: "Wildfire",
    cost: 4,
    unlockCost: 2,
    description: "Efeito da Habilidade: Causa dano médio de Fogo a todos os inimigos. 1 acerto. Aplica 3 Queimaduras.\n\nConsome 2 Manchas de Gelo para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Fogo e 1 Mancha de Luz.",
    image: "Lune_Wildfire.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-mayhem",
    character: "lune",
    name: "Mayhem",
    cost: 3,
    unlockCost: 0,
    description: "Efeito da Habilidade: Consome todas as Manchas para causar dano elemental alto ao alvo.\n\nPode causar quebra se 4 Manchas forem consumidas.",
    image: "Lune_Mayhem.webp",
    preRequisite: ["lune-electrify","lune-thermal-transfer"]
  },
  {
    id: "lune-elemental-trick",
    character: "lune",
    name: "Elemental Trick",
    cost: 3,
    unlockCost: 4,
    description: "Efeito da Habilidade: Causa dano baixo de Gelo, Fogo, Raio e Terra a um único alvo. 4 acertos.\n\nAcertos críticos geram a Mancha correspondente ao elemento.",
    image: "Lune_ElementalTrick.webp",
    preRequisite: ["lune-mayhem"]
  },
  {
    id: "lune-elemental-genesis",
    character: "lune",
    name: "Elemental Genesis",
    cost: 4,
    unlockCost: 10,
    description: "Efeito da Habilidade: Causa dano extremo a todos os inimigos. 8 acertos. Cada acerto causa dano em um elemento aleatório.\n\nRequer Raio, Terra, Fogo e Gelo para lançar.",
    image: "Lune_ElementalGenesis.webp",
    preRequisite: ["lune-elemental-trick"]
  },
  {
    id: "lune-crippling-tsunami",
    character: "lune",
    name: "Crippling Tsunami",
    cost: 5,
    unlockCost: 6,
    description: "Efeito da Habilidade: Causa dano médio de Gelo a todos os inimigos. 1 acerto. Aplica Desaceleração por 3 turnos.\n\nConsome todos os três tipos de Manchas para causar dano muito aumentado.\n\nUsar esta habilidade concede 1 Mancha de Gelo e 1 Mancha de Luz.",
    image: "Lune_CripplingTsunami.webp",
    preRequisite: ["lune-thermal-transfer"]
  },
  {
    id: "lune-rockslide",
    character: "lune",
    name: "Rockslide",
    cost: 5,
    unlockCost: 2,
    description: "Efeito da Habilidade: Causa dano médio de Terra a um único alvo. 2 acertos. Pode causar quebra.\n\nConsome todos os três tipos de Manchas para causar dano muito aumentado.\n\nUsar esta habilidade concede 1 Mancha de Terra e 1 Mancha de Luz.",
    image: "Lune_Rockslide.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-crustal-crush",
    character: "lune",
    name: "Crustal Crush",
    cost: 7,
    unlockCost: 6,
    description: "Efeito da Habilidade: Causa dano alto de Terra e dano de Break a um único alvo. 5 acertos.\n\nConsome 2 Manchas de Raio para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Terra e 1 Mancha de Luz.",
    image: "Lune_CrustalCrush.webp",
    preRequisite: ["lune-rockslide"]
  },
  {
    id: "lune-healing-light",
    character: "lune",
    name: "Healing Light",
    cost: 3,
    unlockCost: 0,
    description: "Efeito da Habilidade: Cura o aliado alvo e dissipa Efeitos de Status.\n\nConsome 2 Manchas de Terra para custar 0 PM.\n\nUsar esta habilidade concede 1 Mancha de Luz.",
    image: "Lune_HealingLight.webp",
    preRequisite: ["lune-ice-lance","lune-immolation"]
  },
  {
    id: "lune-lightning-dance",
    character: "lune",
    name: "Lightning Dance",
    cost: 7,
    unlockCost: 6,
    description: "Efeito da Habilidade: Causa dano muito alto de Raio a um único alvo. 6 acertos.\n\nConsome todos os três tipos de Manchas para causar dano muito aumentado. Acertos críticos adicionam um acerto extra.\n\nUsar esta habilidade concede 1 Mancha de Raio e 1 Mancha de Luz.",
    image: "Lune_LightningDance.webp",
    preRequisite: ["lune-electrify"]
  },
  {
    id: "lune-storm-caller",
    character: "lune",
    name: "Storm Caller",
    cost: 6,
    unlockCost: 8,
    description: "Efeito da Habilidade: Todos os inimigos recebem dano médio de Raio no fim do turno e dano baixo quando recebem dano. Duração: 3 turnos.\n\nConsome 2 Manchas de Fogo para dobrar os ataques de trovão no fim do turno.\n\nUsar esta habilidade concede 1 Mancha de Raio e 1 Mancha de Luz.",
    image: "Lune_StormCaller.webp",
    preRequisite: ["lune-lightning-dance"]
  },
  {
    id: "lune-terraquake",
    character: "lune",
    name: "Terraquake",
    cost: 5,
    unlockCost: 10,
    description: "Efeito da Habilidade: Causa dano baixo de Terra e dano de Break a todos os inimigos a cada turno. Duração: 3 turnos.\n\nConsome 2 Manchas de Raio para estender a duração para 5 turnos.\n\nUsar esta habilidade concede 1 Mancha de Terra e 1 Mancha de Luz.",
    image: "Lune_Terraquake.webp",
    preRequisite: ["lune-crustal-crush"]
  },
  {
    id: "lune-typhoon",
    character: "lune",
    name: "Typhoon",
    cost: 8,
    unlockCost: 8,
    description: "Efeito da Habilidade: No início do turno, causa dano alto de Gelo a todos os inimigos e cura aliados.\n\nConsome 2 Manchas de Terra para estender a duração de 3 para 5 turnos.\n\nUsar esta habilidade concede 1 Mancha de Gelo e 1 Mancha de Luz.",
    image: "Lune_Typhoon.webp",
    preRequisite: ["lune-crippling-tsunami"]
  },
  {
    id: "lune-rebirth",
    character: "lune",
    name: "Rebirth",
    cost: 5,
    unlockCost: 4,
    description: "Efeito da Habilidade: Revive um aliado com 30-70% de Vida e 2 PM adicionais.\n\nConsome 3 Manchas de Raio para custar 0 PM.\n\nUsar esta habilidade concede 1 Mancha de Luz.",
    image: "Lune_Rebirth.webp",
    preRequisite: ["lune-healing-light"]
  },
  {
    id: "lune-revitalization",
    character: "lune",
    name: "Revitalization",
    cost: 5,
    unlockCost: 6,
    description: "Efeito da Habilidade: Cura 1-3 aliados em 40-60% de Vida.\n\nConsome 3 Manchas de Fogo para também aplicar Regeneração por 3 turnos.\n\nUsar esta habilidade concede 1 Mancha de Luz.",
    image: "Lune_Revitalization.webp",
    preRequisite: ["lune-rebirth"]
  },
  {
    id: "lune-fire-rage",
    character: "lune",
    name: "Fire Rage",
    cost: 5,
    unlockCost: 6,
    description: "Efeito da Habilidade: Causa dano alto de Fogo crescente a todos os inimigos a cada turno até Lune receber dano.\n\nConsome 2 Manchas de Gelo para causar dano aumentado.\n\nUsar esta habilidade concede 1 Mancha de Fogo e 1 Mancha de Luz.",
    image: "Lune_FireRage.webp",
    preRequisite: ["lune-wildfire"]
  },
  {
    id: "lune-hell",
    character: "lune",
    name: "Hell",
    cost: 9,
    unlockCost: 10,
    description: "Efeito da Habilidade: Causa dano muito alto de Fogo aplicando 5 Queimaduras por acerto a todos os inimigos. 2 acertos.\n\nConsome todos os três tipos de Manchas para causar dano muito aumentado.\n\nUsar esta habilidade concede 1 Mancha de Fogo e 1 Mancha de Luz.",
    image: "Lune_Hell.webp",
    preRequisite: ["lune-fire-rage"]
  },
  {
    id: "lune-sky-break",
    character: "lune",
    name: "Sky Break",
    cost: 3,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano extremo a todos os inimigos. 1 acerto. Pode causar quebra.\n\nO elemento depende de qual Mancha Lune possui mais.\n\nUsar esta habilidade concede 3 Manchas de Luz.",
    isGradient: true,
    masterUnlock: true,
    image: "Lune_SkyBreak.webp"
  },
  {
    id: "lune-tree-of-life",
    character: "lune",
    name: "Tree of Life",
    cost: 2,
    unlockCost: 0,
    description: "Efeito da Habilidade: Remove todos os Efeitos de Status e cura todos os aliados.\n\nUsar esta habilidade concede 1 Mancha de Luz.",
    isGradient: true,
    masterUnlock: true,
    image: "Lune_TreeOfLife.webp"
  },
  {
    id: "lune-tremor",
    character: "lune",
    name: "Tremor",
    cost: 1,
    unlockCost: 0,
    description: "Efeito da Habilidade: Causa dano alto de Terra a todos os inimigos. 1 acerto. Remove todos os Escudos dos inimigos.\n\nUsar esta habilidade concede 1 Mancha de Terra e 1 Mancha de Luz.",
    isGradient: true,
    masterUnlock: true,
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
    description: "Causa dano baixo em alvo único e aplica Indefeso por 3 turnos. 1 acerto. Usa elemento da arma.",
    image: "Maelle_OffensiveSwitch.webp"
  },
  {
    id: "maelle-mezzo-forte",
    character: "maelle",
    name: "Mezzo Forte",
    cost: 1,
    unlockCost: 4,
    description: "Reaplica a postura atual de Maelle, mantendo suas vantagens táticas. Concede 2-4 PM aleatoriamente. Útil para manter momentum e gerar recursos para combos contínuos.",
    image: "Maelle_MezzoForte.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-percee",
    character: "maelle",
    name: "Percee",
    cost: 5,
    unlockCost: 0,
    description: "Causa dano Físico médio em alvo único. 1 acerto. Dano aumentado em alvos Marcados.",
    image: "Maelle_Percee.webp"
  },
  {
    id: "maelle-degagement",
    character: "maelle",
    name: "Degagement",
    cost: 2,
    unlockCost: 2,
    description: "Causa dano de Fogo baixo em alvo único. 1 acerto. O alvo fica vulnerável a dano de Fogo por 2 turnos.",
    image: "Maelle_Degagement.webp",
    preRequisite: ["maelle-spark","maelle-guard-down"]
  },
  {
    id: "maelle-guard-up",
    character: "maelle",
    name: "Guard Up",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Escudo, reduzindo dano recebido, em até 3 aliados por 3 turnos.",
    image: "Maelle_GuardUp.webp",
    preRequisite: ["maelle-swift-stride"]
  },
  {
    id: "maelle-swift-stride",
    character: "maelle",
    name: "Swift Stride",
    cost: 3,
    unlockCost: 1,
    description: "Causa dano Físico baixo em alvo único. 1 acerto. Muda para postura Virtuosa se o alvo estiver Queimando. Recupera 0 a 2 PM.",
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
    description: "Protege aliados recebendo dano no lugar deles por 2 turnos. Duração é estendida em 1 ao ganhar Escudo.",
    image: "Maelle_Egide.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-spark",
    character: "maelle",
    name: "Spark",
    cost: 3,
    unlockCost: 1,
    description: "Causa dano de Fogo baixo em alvo único. 1 acerto. Aplica 3 Queimaduras.",
    image: "Maelle_Spark.webp",
    preRequisite: ["maelle-offensive-switch"]
  },
  {
    id: "maelle-rain-of-fire",
    character: "maelle",
    name: "Rain of Fire",
    cost: 5,
    unlockCost: 4,
    description: "Causa dano de Fogo médio em alvo único. 2 acertos. Aplica 3 Queimaduras por acerto.",
    image: "Maelle_RainOfFire.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-combustion",
    character: "maelle",
    name: "Combustion",
    cost: 4,
    unlockCost: 6,
    description: "Causa dano Físico médio em alvo único. 2 acertos. Consome até 10 Queimaduras para aumentar o dano.",
    image: "Maelle_Combustion.webp",
    preRequisite: ["maelle-rain-of-fire"]
  },
  {
    id: "maelle-fleuret-fury",
    character: "maelle",
    name: "Fleuret Fury",
    cost: 6,
    unlockCost: 2,
    description: "Causa dano Físico alto em alvo único. 3 acertos. Se estiver em postura Virtuosa, mantém postura Virtuosa. Pode causar quebra.",
    image: "Maelle_FleuretFury.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-breaking-rules",
    character: "maelle",
    name: "Breaking Rules",
    cost: 3,
    unlockCost: 3,
    description: "Causa dano Físico baixo em alvo único. 2 acertos. Destrói todos os Escudos do alvo. Ganha 1 AP por Escudo destruído. Se o alvo estiver Indefeso, jogue um segundo turno.",
    image: "Maelle_BreakingRules.webp",
    preRequisite: ["maelle-fleuret-fury"]
  },
  {
    id: "maelle-fencers-flurry",
    character: "maelle",
    name: "Fencer's Flurry",
    cost: 4,
    unlockCost: 6,
    description: "Causa dano médio em todos os inimigos. 1 acerto. Usa elemento da arma. Aplica Indefeso por 1 turno.",
    image: "Maelle_FencersFlurry.webp",
    preRequisite: ["maelle-breaking-rules"]
  },
  {
    id: "maelle-phantom-strike",
    character: "maelle",
    name: "Phantom Strike",
    cost: 7,
    unlockCost: 4,
    description: "Causa dano de Vazio muito alto em todos os inimigos. 4 acertos. Também fornece +35% de uma Carga de Gradiente.",
    image: "Maelle_PhantomStrike.webp",
    preRequisite: ["maelle-offensive-switch","maelle-burning-canvas"]
  },
  {
    id: "maelle-burning-canvas",
    character: "maelle",
    name: "Burning Canvas",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano de Vazio alto em alvo único. 5 acertos. Aplica 1 Queimadura por acerto. Dano aumentado para cada Queimadura no alvo.",
    image: "Maelle_BurningCanvas.webp",
    preRequisite: ["maelle-phantom-strike","maelle-stendhal"]
  },
  {
    id: "maelle-revenge",
    character: "maelle",
    name: "Revenge",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano de Fogo alto em alvo único. 1 acerto. Dano aumenta proporcionalmente ao número de acertos recebidos desde o último turno de Maelle. Pode causar quebra. Muda a postura para Defensiva. Recompensa estilo defensivo/tanque.",
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
    description: "Reduz a Vida própria para 1, mas recarrega todos os PM (Pontos de Ação) para o máximo. Muda a postura para Virtuosa. Útil para combos devastadores, mas deixa Maelle extremamente vulnerável.",
    image: "Maelle_LastChance.webp",
    preRequisite: ["maelle-mezzo-forte"]
  },
  {
    id: "maelle-momentum-strike",
    character: "maelle",
    name: "Momentum Strike",
    cost: 7,
    unlockCost: 6,
    description: "Causa dano alto em alvo único usando elemento da arma. 1 acerto. +50% de dano contra alvos Marcados. Custo: 7 PM (reduzido para 4 PM quando usado da postura Virtuosa). Muda a postura para Defensiva.",
    image: "Maelle_MomentumStrike.webp",
    preRequisite: ["maelle-egide"]
  },
  {
    id: "maelle-payback",
    character: "maelle",
    name: "Payback",
    cost: 9,
    unlockCost: 8,
    description: "Causa dano Físico muito alto em alvo único. 1 acerto. Dano aumenta por acertos recebidos desde o último turno. Custo de PM reduzido em 1 para cada ataque aparado com sucesso. Pode causar quebra. Muda a postura para Defensiva.",
    image: "Maelle_Payback.webp",
    preRequisite: ["maelle-last-chance","maelle-momentum-strike"]
  },
  {
    id: "maelle-stendhal",
    character: "maelle",
    name: "Stendhal",
    cost: 8,
    unlockCost: 4,
    description: "Causa dano de Vazio extremo em alvo único. 1 acerto. Remove Escudos próprios e aplica Indefeso em si mesma.",
    image: "Maelle_Stendhal.webp",
    preRequisite: ["maelle-percee","maelle-burning-canvas"]
  },
  {
    id: "maelle-sword-ballet",
    character: "maelle",
    name: "Sword Ballet",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano extremo em alvo único. 5 acertos. Usa elemento da arma. Acertos Críticos causam o dobro do dano.",
    image: "Maelle_SwordBallet.webp",
    preRequisite: ["maelle-fencers-flurry"]
  },
  {
    id: "maelle-gustaves-homage",
    character: "maelle",
    name: "Gustave's Homage",
    cost: 8,
    unlockCost: 8,
    description: "Causa dano de Raio alto em alvo único. 8 acertos. Dano aumentado em alvos Marcados, não remove Marca.",
    image: "Maelle_SpoilerSkill.webp"
  },
  {
    id: "maelle-virtuose-strike",
    character: "maelle",
    name: "Virtuose Strike",
    cost: 1,
    unlockCost: 0,
    description: "Causa dano Físico alto em alvo único. 5 acertos.",
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
    description: "Aplica 10 Queimaduras em todos os inimigos e revive todos os aliados com 50 a 70% de Vida.",
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
    description: "Causa dano das Trevas baixo em alvo único. 1 acerto. Consome todas as Predições para aumentar o dano. Habilidade inicial de Sciel.",
    type: "moon",
    image: "Sciel_TwilightSlash.webp"
  },
  {
    id: "sciel-focused-foretell",
    character: "sciel",
    name: "Focused Foretell",
    cost: 2,
    unlockCost: 0,
    description: "Causa dano Físico médio em alvo único. 1 acerto. Aplica 2 Predições. Aplica 3 Predições adicionais se o alvo não tiver Predições.",
    type: "sun",
    image: "Sciel_FocusedForetell.webp"
  },
  {
    id: "sciel-bad-omen",
    character: "sciel",
    name: "Bad Omen",
    cost: 3,
    unlockCost: 4,
    description: "Causa dano das Trevas baixo em todos os inimigos. 2 acertos. Aplica 2 Predições por acerto. Requer habilidade Marking Card.",
    type: "sun",
    image: "Sciel_BadOmen.webp",
    preRequisite: ["sciel-marking-card"]
  },
  {
    id: "sciel-marking-card",
    character: "sciel",
    name: "Marking Card",
    cost: 3,
    unlockCost: 2,
    description: "Causa dano das Trevas médio em alvo único. 2 acertos. Aplica Marcado. Aplica 3 Predições.",
    type: "sun",
    image: "Sciel_MarkingCard.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-delaying-slash",
    character: "sciel",
    name: "Delaying Slash",
    cost: 5,
    unlockCost: 6,
    description: "Causa dano médio em alvo único. 2 acertos. Usa elemento da arma. Consome Predições para aumentar o dano e atrasar o turno do alvo.",
    type: "moon",
    image: "Sciel_DelayingSlash.webp",
    preRequisite: ["sciel-bad-omen"]
  },
  {
    id: "sciel-dark-cleansing",
    character: "sciel",
    name: "Dark Cleansing",
    cost: 0,
    unlockCost: 2,
    description: "Remove todos os efeitos de status negativos de um aliado. Propaga os buffs do alvo para todos os aliados.",
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
    description: "Causa dano das Trevas alto em todos os inimigos. 3 acertos. Consome todas as Predições para aumentar o dano.",
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
    description: "Causa dano das Trevas médio em alvo único. 1 acerto. Cura todos os aliados em 30% da Vida. Consome Predições para aumentar a cura em 5% por Predição.",
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
    description: "Causa dano médio em alvo único. 1 acerto. Usa elemento da arma. Cura Sciel em 40% da Vida. Consome todas as Predições para aumentar a cura em 5% por Predição.",
    type: "moon",
    image: "Sciel_Harvest.webp",
    preRequisite: ["sciel-twilight-slash"]
  },
  {
    id: "sciel-searing-bond",
    character: "sciel",
    name: "Searing Bond",
    cost: 4,
    unlockCost: 2,
    description: "Causa dano das Trevas médio em alvo único. 1 acerto. Aplica 5 Predições. Causa dano e aplica Predições em todos os outros inimigos Queimando.",
    type: "sun",
    image: "Sciel_SearingBond.webp",
    preRequisite: ["sciel-harvest"]
  },
  {
    id: "sciel-phantom-blade",
    character: "sciel",
    name: "Phantom Blade",
    cost: 5,
    unlockCost: 2,
    description: "Causa dano das Trevas alto em alvo único. 1 acerto. Consome todas as Predições para aumentar o dano. Pode causar quebra.",
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
    description: "Causa dano alto em alvo único. 5-7 acertos. Usa elemento da arma. Cada acerto pode consumir 1 Predição para causar 200% mais dano.",
    type: "moon",
    image: "Sciel_SealedFate.webp",
    preRequisite: ["sciel-phantom-blade"]
  },
  {
    id: "sciel-spectral-sweep",
    character: "sciel",
    name: "Spectral Sweep",
    cost: 7,
    unlockCost: 2,
    description: "Causa dano médio em alvo único. 2-6 acertos. Usa elemento da arma. Aplica 1 Predição por acerto. Acertos críticos aplicam Predição adicional.",
    type: "sun",
    image: "Sciel_SpectralSweep.webp",
    preRequisite: ["sciel-rush"]
  },
  {
    id: "sciel-firing-shadow",
    character: "sciel",
    name: "Firing Shadow",
    cost: 3,
    unlockCost: 2,
    description: "Causa dano das Trevas baixo em todos os inimigos. 3 acertos. Consome 1 Predição por acerto para aumentar o dano.",
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
    description: "Um aliado alvo causa o dobro de dano durante 1 turno.",
    type: "sun",
    image: "Sciel_FortunesFury.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-our-sacrifice",
    character: "sciel",
    name: "Our Sacrifice",
    cost: 4,
    unlockCost: 8,
    description: "Causa dano das Trevas extremo em todos os inimigos. 1 acerto. Absorve Vida dos aliados e Predições dos inimigos para aumentar o dano.",
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
    description: "Causa dano Físico médio em alvo único. 2 acertos. Consome todas as Predições do alvo e concede 1 PM a um aliado por Predição consumida.",
    type: "moon",
    image: "Sciel_PlentifulHarvest.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-rush",
    character: "sciel",
    name: "Rush",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Rapidez em 1-3 aliados, aumentando a Velocidade por 3 turnos.",
    type: "sun",
    image: "Sciel_Rush.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-all-set",
    character: "sciel",
    name: "All Set",
    cost: 6,
    unlockCost: 6,
    description: "Aplica Escudo, Poderoso e Rapidez em todos os aliados.",
    type: "sun",
    image: "Sciel_AllSet.webp",
    preRequisite: ["sciel-card-weaver"]
  },
  {
    id: "sciel-intervention",
    character: "sciel",
    name: "Intervention",
    cost: 5,
    unlockCost: 6,
    description: "Um aliado alvo joga imediatamente e ganha 4 PM.",
    type: "moon",
    image: "Sciel_Intervention.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-card-weaver",
    character: "sciel",
    name: "Card Weaver",
    cost: 3,
    unlockCost: 4,
    description: "Causa dano Físico baixo em alvo único. 1 acerto. Propaga as Predições do alvo para todos os inimigos. Joga um segundo turno.",
    type: "sun",
    image: "Sciel_CardWeaver.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-final-path",
    character: "sciel",
    name: "Final Path",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano das Trevas extremo em alvo único. 1 acerto. Aplica 10 Predições. Pode causar quebra.",
    type: "sun",
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
    description: "Causa dano das Trevas extremo em alvo único. 4 acertos. Durante o Crepúsculo, estende a duração do Crepúsculo em 1 turno. Consome todas as Predições para aumentar o dano.",
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
    description: "Habilidade Gradiente. Causa dano das Trevas alto em inimigos aleatórios. 10 acertos. Aplica 1 Predição por acerto.",
    isGradient: true,
    masterUnlock: true,
    type: "sun",
    image: "Sciel_ShadowBringer.webp"
  },
  {
    id: "sciel-doom",
    character: "sciel",
    name: "Doom",
    cost: 2,
    unlockCost: 0,
    description: "Habilidade Gradiente. Causa dano das Trevas muito alto em alvo único. 3 acertos. Aplica Fraco, Indefeso e Lento por 3 turnos. Pode causar quebra.",
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
    description: "Habilidade Gradiente. Causa dano Físico extremo em alvo único. 1 acerto. O dano escala com a quantidade de Predições consumidas.",
    isGradient: true,
    masterUnlock: true,
    type: "moon",
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
    description: "Causa dano Físico extremo. 8 golpes. Ganha 1 Perfeição adicional por golpe. Aplica Auréola em Verso, revivendo-o se morrer.",
    isGradient: true,
    masterUnlock: true,
    image: "Verso_AngelsEyes.webp"
  },
  {
    id: "verso-ascending-assault",
    character: "verso",
    name: "Ascending Assault",
    cost: 5,
    unlockCost: 4,
    description: "Causa dano baixo em alvo único. 1 golpe. Usa elemento da arma. Aumenta dano a cada uso. Se Verso usar esta habilidade no Rank S de Perfeição, o custo de AP é reduzido de 5 para 2.",
    preRequisite: ["verso-blitz"],
    image: "Verso_AscendingAssault.webp"
  },
  {
    id: "verso-assault-zero",
    character: "verso",
    name: "Assault Zero",
    cost: 3,
    unlockCost: 0,
    description: "Causa dano baixo em alvo único. 5 golpes. Usa elemento da arma. Acertos Críticos geram 1 Perfeição adicional. Se Verso usar esta habilidade no Rank B de Perfeição, o dano é aumentado.",
    image: "Verso_AssaultZero.webp"
  },
  {
    id: "verso-berserk-slash",
    character: "verso",
    name: "Berserk Slash",
    cost: 4,
    unlockCost: 2,
    description: "Causa dano Físico médio em alvo único. 3 golpes. Dano aumenta para cada vida que Verso está faltando. Se Verso usar esta habilidade no Rank C de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-quick-strike"],
    image: "Verso_BerserkSlash.webp"
  },
  {
    id: "verso-blitz",
    character: "verso",
    name: "Blitz",
    cost: 3,
    unlockCost: 2,
    description: "Causa dano Físico baixo em alvo único. 1 golpe. Joga uma segunda vez. Mata inimigos não-chefes com menos de 10% de vida. Se Verso usar esta habilidade no Rank B de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-purification"],
    image: "Verso_Blitz.webp"
  },
  {
    id: "verso-burden",
    character: "verso",
    name: "Burden",
    cost: 1,
    unlockCost: 4,
    description: "Remove todos os Efeitos de Status de todos os aliados e os aplica em Verso. Ganha 1 Rank.",
    preRequisite: ["verso-berserk-slash"],
    image: "Verso_Burden.webp"
  },
  {
    id: "verso-defiant-strike",
    character: "verso",
    name: "Defiant Strike",
    cost: 3,
    unlockCost: 6,
    description: "Causa dano Físico alto em alvo único que aplica Marca. 2 golpes. Custa 30% da vida atual. Se Verso usar esta habilidade no Rank B de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-berserk-slash"],
    image: "Verso_DefiantStrike.webp"
  },
  {
    id: "verso-endbringer",
    character: "verso",
    name: "Endbringer",
    cost: 9,
    unlockCost: 10,
    description: "Causa dano Físico extremo em alvo único. 6 golpes. Dano aumentado se o alvo estiver Atordoado. Se Verso usar esta habilidade no Rank A de Perfeição, pode reaplicar Atordoamento.",
    preRequisite: ["verso-light-holder", "verso-steeled-strike"],
    image: "Verso_Endbringer.webp"
  },
  {
    id: "verso-followup",
    character: "verso",
    name: "Follow Up",
    cost: 5,
    unlockCost: 4,
    description: "Causa dano de Luz médio em alvo único. 1 golpe. Dano aumentado para cada tiro de Mira Livre neste turno, até 10 vezes. Se Verso usar esta habilidade no Rank S de Perfeição, o custo de AP é reduzido de 5 para 2.",
    preRequisite: ["verso-purification"],
    image: "Verso_Followup.webp"
  },
  {
    id: "verso-from-fire",
    character: "verso",
    name: "From Fire",
    cost: 4,
    unlockCost: 0,
    description: "Causa dano médio em alvo único. 3 golpes. Usa elemento da arma. Cura Verso em 20% de Vida se o alvo estiver Queimando. Se Verso usar esta habilidade no Rank B de Perfeição, o dano é aumentado.",
    image: "Verso_FromFire.webp"
  },
  {
    id: "verso-leadership",
    character: "verso",
    name: "Leadership",
    cost: 3,
    unlockCost: 4,
    description: "Reduz o Rank atual. Dá 2-4 AP para outros aliados. Se Verso usar esta habilidade no Rank C de Perfeição, dá +1 AP adicional para outros aliados.",
    preRequisite: ["verso-powerful"],
    image: "Verso_Leadership.webp"
  },
  {
    id: "verso-light-holder",
    character: "verso",
    name: "Light Holder",
    cost: 4,
    unlockCost: 6,
    description: "Causa dano de Luz médio em alvo único. 5 golpes. Ao completar, ganha 1 Rank. Se Verso usar esta habilidade no Rank A de Perfeição, concede 2 AP adicionais para Verso.",
    preRequisite: ["verso-radiant-slash"],
    image: "Verso_LightHolder.webp"
  },
  {
    id: "verso-marking-shot",
    character: "verso",
    name: "Marking Shot (Verso)",
    cost: 3,
    unlockCost: 3,
    description: "Causa dano de Raio baixo em alvo único. 1 golpe. Aplica Marca.",
    image: "Verso_MarkingShot.webp"
  },
  {
    id: "verso-overload",
    character: "verso",
    name: "Overload",
    cost: 0,
    unlockCost: 6,
    description: "Aumenta o Rank para S e reenche todo o AP, mas define a vida própria para 1.",
    preRequisite: ["verso-followup", "verso-speedburst"],
    image: "Verso_Overload.webp"
  },
  {
    id: "verso-paradigm-shift",
    character: "verso",
    name: "Paradigm Shift",
    cost: 1,
    unlockCost: 2,
    description: "Causa dano Físico baixo em alvo único e devolve 1-3 AP. 3 golpes. Se Verso usar esta habilidade no Rank C de Perfeição, concede 1 AP adicional para Verso.",
    preRequisite: ["verso-purification", "verso-quick-strike"],
    image: "Verso_ParadigmShift.webp"
  },
  {
    id: "verso-perfect-break",
    character: "verso",
    name: "Perfect Break",
    cost: 7,
    unlockCost: 4,
    description: "Causa dano de Luz muito alto em alvo único. 1 golpe. Pode Quebrar. Se Verso usar esta habilidade no Rank B de Perfeição, o custo de AP é reduzido de 7 para 5.",
    preRequisite: ["verso-blitz", "verso-berserk-slash"],
    image: "Verso_PerfectBreak.webp"
  },
  {
    id: "verso-perfect-recovery",
    character: "verso",
    name: "Perfect Recovery",
    cost: 3,
    unlockCost: 1,
    description: "Recupera 50% de Vida e dissipa Efeitos de Status. Dá 0-2 Perfeição. Se Verso usar esta habilidade no Rank C de Perfeição, o efeito de cura é aumentado para 100%.",
    preRequisite: ["verso-from-fire"],
    image: "Verso_PerfectRecovery.webp"
  },
  {
    id: "verso-phantom-stars",
    character: "verso",
    name: "Phantom Stars",
    cost: 9,
    unlockCost: 8,
    description: "Causa dano de Luz extremo em todos os inimigos. 5 golpes. Pode Quebrar. Se Verso usar esta habilidade no Rank S de Perfeição, o custo de AP é reduzido de 9 para 5.",
    preRequisite: ["verso-burden"],
    image: "Verso_PhantomStars.webp"
  },
  {
    id: "verso-powerful",
    character: "verso",
    name: "Powerful",
    cost: 3,
    unlockCost: 2,
    description: "Aplica Fortalecido (aumenta dano) em 1-3 aliados por 3 turnos. Rola 1d6: (1-3) apenas Verso, (4-6) toda equipe. Se Verso usar esta habilidade no Rank A de Perfeição, a duração aumenta para 5 turnos.",
    preRequisite: ["verso-quick-strike"],
    image: "Verso_Powerful.webp"
  },
  {
    id: "verso-purification",
    character: "verso",
    name: "Purification",
    cost: 5,
    unlockCost: 2,
    description: "Causa dano de Luz médio em alvo único. 2 golpes. Dissipa Efeitos de Status próprios. Se Verso usar esta habilidade no Rank B de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-perfect-recovery"],
    image: "Verso_Purification.webp"
  },
  {
    id: "verso-quick-strike",
    character: "verso",
    name: "Quick Strike",
    cost: 2,
    unlockCost: 2,
    description: "Causa dano Físico baixo em alvo único. 1 golpe. Se Verso usar esta habilidade no Rank D de Perfeição: Dá mais Perfeição.",
    preRequisite: ["verso-marking-shot"],
    image: "Verso_QuickStrike.webp"
  },
  {
    id: "verso-radiant-slash",
    character: "verso",
    name: "Radiant Slash",
    cost: 2,
    unlockCost: 4,
    description: "Causa dano de Luz baixo em todos os inimigos. 1 golpe. Pode Quebrar. Se Verso usar esta habilidade no Rank C de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-blitz"],
    image: "Verso_RadiantSlash.webp"
  },
  {
    id: "verso-sabotage",
    character: "verso",
    name: "Sabotage",
    cost: 1,
    unlockCost: 0,
    description: "Causa dano Físico médio em todos os inimigos. 1 golpe. Aplica Marca.",
    isGradient: true,
    masterUnlock: true,
    image: "Verso_Sabotage.webp"
  },
  {
    id: "verso-speedburst",
    character: "verso",
    name: "Speed Burst",
    cost: 6,
    unlockCost: 6,
    description: "Causa dano de Luz alto em alvo único. 5 golpes. Dano aumentado pela diferença de Velocidade com o alvo. Se Verso usar esta habilidade no Rank C de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-ascending-assault", "verso-overload"],
    image: "Verso_Speedburst.webp"
  },
  {
    id: "verso-steeled-strike",
    character: "verso",
    name: "Steeled Strike",
    cost: 9,
    unlockCost: 10,
    description: "Após 1 turno, causa dano Físico extremo em alvo único. 13 golpes. Interrompido se receber qualquer dano. Se Verso usar esta habilidade no Rank S de Perfeição, o dano é aumentado.",
    preRequisite: ["verso-strike-storm", "verso-endbringer"],
    image: "Verso_SteeledStrike.webp"
  },
  {
    id: "verso-striker",
    character: "verso",
    name: "Striker",
    cost: 2,
    unlockCost: 0,
    description: "Causa dano Físico alto em alvo único. 1 golpe. Pode Quebrar.",
    isGradient: true,
    masterUnlock: true,
    image: "Verso_Striker.webp"
  },
  {
    id: "verso-strike-storm",
    character: "verso",
    name: "Strike Storm",
    cost: 7,
    unlockCost: 10,
    description: "Causa dano muito alto em alvo único. 6 golpes. Usa elemento da arma. Acertos Críticos geram 2 Cargas adicionais.",
    preRequisite: ["verso-from-fire"],
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
    unlockCost: 0,
    masterUnlock: true,
    description: "Wind-based attack.\n\nEfeito: Causa dano Físico baixo em alvo único. 1 acerto. Joga um segundo turno. Normalmente custa 2 PM, mas quando o Ponteiro da Roda Bestial está posicionado em uma Máscara Ágil ou Máscara Onipotente, o custo reduz para 0 PM. Usar esta habilidade avança o Ponteiro da Roda Bestial em 2 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Abbest enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_AbbestWind.webp"
  },
  {
    id: "monoco-aberration-light",
    character: "monoco",
    name: "Aberration Light",
    cost: 7,
    unlockCost: 0,
    masterUnlock: true,
    description: "Aberration light attack.\n\nEfeito: Causa dano de Luz alto em todos os inimigos. 2 acertos. Aplica 4 Queimaduras por acerto. Máscara Ágil: Aplica 2 Queimaduras adicionais por acerto. Custa 7 PM. Usar esta habilidade avança o Ponteiro da Roda Bestial em 4 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Aberration enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_AberrationLight.webp"
  },
  {
    id: "monoco-ballet-charm",
    character: "monoco",
    name: "Ballet Charm",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Charming ballet-style attack.\n\nEfeito: Causa dano de Luz baixo em alvo único. 1 acerto. Aplica Indefeso no alvo por 3 turnos. Aumenta o dano quando usado com Máscara de Conjurador equipada. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Ballet enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_BalletCharm.webp"
  },
  {
    id: "monoco-benisseur-mortar",
    character: "monoco",
    name: "Benisseur Mortar",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Mortar bombardment attack.\n\nEfeito: Causa dano de Gelo médio em alvo único. 3 acertos. Muda para Máscara Onipotente se o alvo estiver Marcado. Máscara de Conjurador: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Bénisseur enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_BenisseurMortar.webp"
  },
  {
    id: "monoco-boucheclier-fortify",
    character: "monoco",
    name: "Boucheclier Fortify",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Shield fortification skill.\n\nEfeito: Aplica Carapaça em 1-3 aliados por 3 turnos. Máscara Pesada: Também aplica 1 Escudo. Usar esta habilidade move o Ponteiro da Roda Bestial em 5 posições. Quando o ponteiro está em Máscara Pesada ou Máscara Onipotente, concede 1 Escudo aos aliados afetados.\nPré-requisito: Derrote e adquira o pé de um inimigo Boucheclier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_BoucheclierFortify.webp"
  },
  {
    id: "monoco-braseleur-smash",
    character: "monoco",
    name: "Braseleur Smash",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Powerful smashing attack.\n\nEfeito: Causa dano de Fogo médio em alvo único e aplica 3 Queimaduras. 2 acertos. Dano aumentado quando o Ponteiro da Roda Bestial está posicionado em Máscara Equilibrada ou Máscara Onipotente. Usar esta habilidade avança o Ponteiro da Roda Bestial em 2 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Braseleur enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_BraseleurSmash.webp"
  },
  {
    id: "monoco-break-point",
    character: "monoco",
    name: "Break Point",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    isGradient: true,
    description: "Critical break point attack.\n\nEfeito: Causa dano extremo em alvo único. 1 acerto. Usa elemento da arma. Preenche a Barra de Break do alvo e causa Break. Habilidade Gradiente (não consome turno).\nPré-requisito: Alcance Nível de Relacionamento 7 com Monoco.",
    image: "Monoco_BreakPoint.webp"
  },
  {
    id: "monoco-bruler-bash",
    character: "monoco",
    name: "Bruler Bash",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Burning bash attack.\n\nEfeito: Causa dano Físico médio em alvo único. 3 acertos. Pode causar quebra. Dano aumentado quando Máscara de Conjurador está ativa. Avança o Ponteiro da Roda Bestial em 4 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Bruler enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_BrulerBash.webp"
  },
  {
    id: "monoco-chalier-combo",
    character: "monoco",
    name: "Chalier Combo",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Multi-hit combo attack.\n\nEfeito: Causa dano Físico alto em alvo único. 6 acertos. Interrompido se falhar. Dano aumentado quando usado com Máscara Equilibrada ativa.\nPré-requisito: Habilidade inicial de Monoco, não requer pré-requisito.",
    image: "Monoco_ChalierCombo.webp"
  },
  {
    id: "monoco-chapelier-slash",
    character: "monoco",
    name: "Chapelier Slash",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Slashing attack.\n\nEfeito: Causa dano Físico alto em todos os inimigos. 3 acertos. Aplica Marca. Move o Ponteiro da Roda Bestial em 4 posições. Dano aumentado quando usado enquanto o ponteiro está em Máscara Ágil ou Máscara Onipotente.\nPré-requisito: Derrote e adquira o pé de um inimigo Chapelier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ChapelierSlash.webp"
  },
  {
    id: "monoco-chevaliere-ice",
    character: "monoco",
    name: "Chevaliere Ice",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Ice-based knight attack.\n\nEfeito: Causa dano de Gelo alto em todos os inimigos. 3 acertos. Aplica Lento nos alvos por 3 turnos. Modificador de Máscara Equilibrada aumenta o dano quando o Ponteiro da Roda Bestial está posicionado em Máscara Equilibrada ou Máscara Onipotente.\nPré-requisito: Derrote e adquira o pé de um inimigo Gold Chevalière enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ChevaliereIce.webp"
  },
  {
    id: "monoco-chevaliere-piercing",
    character: "monoco",
    name: "Chevaliere Piercing",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Piercing knight attack.\n\nEfeito: Causa dano Físico em alvo único atravessando Escudos. 6 acertos. Dano aumentado para cada Escudo no alvo. Dano aumentado quando usado com Máscara Ágil equipada.\nPré-requisito: Derrote e adquira o pé de um inimigo Ceramic Chevalière enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ChevalierePiercing.webp"
  },
  {
    id: "monoco-chevaliere-thrusts",
    character: "monoco",
    name: "Chevaliere Thrusts",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Multiple thrusting attacks.\n\nEfeito: Causa dano Físico alto em todos os inimigos. 3 acertos. Acertos Críticos causam o dobro do dano. Máscara Pesada: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Steel Chevalière enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ChevaliereThrusts.webp"
  },
  {
    id: "monoco-clair-enfeeble",
    character: "monoco",
    name: "Clair Enfeeble",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Enfeebling light attack.\n\nEfeito: Causa dano de Luz médio em todos os inimigos. 1 acerto. Aplica Indefeso por 3 turnos. Usar enquanto o Ponteiro da Roda Bestial está em Máscara Equilibrada ou Máscara Onipotente aumenta o dano.\nPré-requisito: Derrote e adquira o pé de um inimigo Clair enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ClairEnfeeble.webp"
  },
  {
    id: "monoco-contorsionniste-blast",
    character: "monoco",
    name: "Contorsionniste Blast",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Contortionist explosive blast.\n\nEfeito: Causa dano Físico médio em todos os inimigos. 1 acerto. Cura todos os aliados em 10% de Vida para cada inimigo atingido. Dano aumentado quando o Ponteiro da Roda Bestial está posicionado em Máscara Equilibrada ou Máscara Onipotente.\nPré-requisito: Derrote e adquira o pé de um inimigo Contorsionniste enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ContorsionnisteBlast.webp"
  },
  {
    id: "monoco-creation-void",
    character: "monoco",
    name: "Creation Void",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Creates void energy.\n\nEfeito: Causa dano de Vazio extremo em alvos aleatórios. 3 acertos. Dano aumentado se o mesmo alvo for atingido múltiplas vezes. Recebe aumento de dano quando utilizado enquanto o Ponteiro da Roda Bestial se alinha com Máscara de Conjurador ou Máscara Onipotente.\nPré-requisito: Derrote e adquira o pé de um inimigo Création enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_CreationVoid.webp"
  },
  {
    id: "monoco-cruler-barrier",
    character: "monoco",
    name: "Cruler Barrier",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Protective barrier skill.\n\nEfeito: Aplica 1-2 Escudos no alvo. Máscara Pesada: Concede 2 PM ao alvo. Usar esta habilidade avança o Ponteiro da Roda Bestial em 4 posições. Quando ativado enquanto o ponteiro está em Máscara Pesada ou Máscara Onipotente, concede 2 PM adicionais ao alvo.\nPré-requisito: Derrote e adquira o pé de um inimigo Cruler enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_CrulerBarrier.webp"
  },
  {
    id: "monoco-cultist-blood",
    character: "monoco",
    name: "Cultist Blood",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Blood-based cultist attack.\n\nEfeito: Causa dano das Trevas médio em todos os inimigos. 3 acertos. Sacrifica 90% de Vida para aumentar o dano. Máscara Pesada: Dano aumentado. Usar esta habilidade avança o Ponteiro da Roda Bestial em 5 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Greatsword Cultist enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_CultistBlood.webp"
  },
  {
    id: "monoco-cultist-slashes",
    character: "monoco",
    name: "Cultist Slashes",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Multiple cultist slashing attacks.\n\nEfeito: Causa dano das Trevas médio em alvo único. 3 acertos. Causa mais dano quanto menos Vida Monoco tiver. Dano aumentado quando o Ponteiro da Roda Bestial se alinha com Máscara Ágil ou Máscara Onipotente. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Reaper Cultist enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_CultistSlashes.webp"
  },
  {
    id: "monoco-danseuse-waltz",
    character: "monoco",
    name: "Danseuse Waltz",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Graceful waltzing attack.\n\nEfeito: Causa dano de Fogo alto em alvo único. 3 acertos. Causa mais dano contra alvos Queimando. Máscara Equilibrada: Dano aumentado. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Danseuses enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_DanseuseWaltz.webp"
  },
  {
    id: "monoco-demineur-thunder",
    character: "monoco",
    name: "Demineur Thunder",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Thunder-based explosive attack.\n\nEfeito: Causa dano de Raio baixo em alvo único. 1 acerto. Causa dano de Break extra. Bônus de dano de Break aumentado quando a Máscara de Conjurador está ativa. Usar esta habilidade avança o Ponteiro da Roda Bestial em 5 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Demineur enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_DemineurThunder.webp"
  },
  {
    id: "monoco-duallist-storm",
    character: "monoco",
    name: "Duallist Storm",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Dual-wielding storm attack.\n\nEfeito: Causa dano Físico extremo em alvo único. 4 acertos. Pode causar quebra. Máscara Onipotente: Dano aumentado. Usar esta habilidade avança o Ponteiro da Roda Bestial em 1 posição.\nPré-requisito: Derrote e adquira o pé de um inimigo Dualliste enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_DuallistStorm.webp"
  },
  {
    id: "monoco-echassier-stabs",
    character: "monoco",
    name: "Echassier Stabs",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Multiple stabbing attacks.\n\nEfeito: Causa dano Físico médio em alvo único. 2 acertos. O segundo acerto aplica Marca no alvo. Máscara Ágil: Dano aumentado. Usar esta habilidade avança o Ponteiro da Roda Bestial em 4 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Échassier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_EchassierStabs.webp"
  },
  {
    id: "monoco-eveque-spear",
    character: "monoco",
    name: "Eveque Spear",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Bishop's spear attack.\n\nEfeito: Causa dano de Terra alto em alvo único e aplica Impotente por 3 turnos. 1 acerto. Dano aumentado quando usado com modificador de Máscara Pesada. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Évêque enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_EvequeSpear.webp"
  },
  {
    id: "monoco-gault-fury",
    character: "monoco",
    name: "Gault Fury",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Furious rage attack.\n\nEfeito: Causa dano Físico baixo em alvo único. 4 acertos. Aplica Marca. Máscara Equilibrada: Dano aumentado. Usar esta habilidade avança o Ponteiro da Roda Bestial em 2 posições. Quando ativado enquanto o ponteiro está em Máscara Equilibrada ou Máscara Onipotente, o dano aumenta.\nPré-requisito: Derrote e adquira o pé de um inimigo Gault enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_GaultFury.webp"
  },
  {
    id: "monoco-glaise-earthquakes",
    character: "monoco",
    name: "Glaise Earthquakes",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Earth-shaking earthquake attack.\n\nEfeito: Causa dano de Terra médio em todos os inimigos. 3 acertos. Aplica Fortalecido em si mesmo. Máscara Pesada: aplica Fortalecido em todos os aliados. Usar esta habilidade avança o Ponteiro da Roda Bestial em 6 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Glaise enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_GlaiseEarthquakes.webp"
  },
  {
    id: "monoco-hexga-crush",
    character: "monoco",
    name: "Hexga Crush",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Crushing hex attack.\n\nEfeito: Causa dano de Terra médio em alvo único. 2 acertos. Aplica Indefeso no alvo por 3 turnos. Modificador de Máscara Pesada aumenta o dano. Requer 5 PM para lançar e avança o Ponteiro da Roda Bestial em 6 posições. Quando usado enquanto o ponteiro está em Máscara Pesada ou Máscara Onipotente, a duração do debuff aumenta para 5 turnos.\nPré-requisito: Derrote e adquira o pé de um inimigo Hexga enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_HexgaCrush.webp"
  },
  {
    id: "monoco-jar-lampstorm",
    character: "monoco",
    name: "Jar Lampstorm",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Lamp jar storm attack.\n\nEfeito: Causa dano Físico médio em todos os inimigos. 4 acertos. Máscara Pesada: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Jar enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_JarLampstorm.webp"
  },
  {
    id: "monoco-lampmaster-light",
    character: "monoco",
    name: "Lampmaster Light",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Master lamp light attack.\n\nEfeito: Causa dano de Luz alto em todos os inimigos. 1 acerto. Dano aumentado a cada uso. Inclui aprimoramento de Máscara Onipotente que fornece dano aumentado. O dano escala com cada uso sucessivo, atingindo o máximo após cinco lançamentos.\nPré-requisito: Derrote e adquira o pé de um inimigo Lampmaster enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_LampmasterLight.webp"
  },
  {
    id: "monoco-lancelier-impale",
    character: "monoco",
    name: "Lancelier Impale",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Impaling lance attack.\n\nEfeito: Causa dano de Gelo baixo em alvo único. 1 acerto. Desacelera o alvo por 3 turnos. Dano aumentado quando usado com o aprimoramento de Máscara Ágil ativo no Ponteiro da Roda Bestial.\nPré-requisito: Derrote e adquira o pé de um inimigo Lancelier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_LancelierImpale.webp"
  },
  {
    id: "monoco-luster-slices",
    character: "monoco",
    name: "Luster Slices",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Lustrous slicing attacks.\n\nEfeito: Causa dano Físico baixo em alvo único. 3 acertos. Aplica Rapidez em si mesmo por 3 turnos. Ter Máscara Ágil ou Máscara Onipotente ativa aumenta o dano.\nPré-requisito: Derrote e adquira o pé de um inimigo Luster enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_LusterSlices.webp"
  },
  {
    id: "monoco-mighty-strike",
    character: "monoco",
    name: "Mighty Strike",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Powerful mighty strike.\n\nEfeito: Causa dano alto em alvo único. 2 acertos. Usa elemento da arma. Causa o dobro do dano se o alvo estiver Atordoado. Vai para Máscara Onipotente.\nPré-requisito: Desbloqueado automaticamente ao aprender o recurso de Ataques/Habilidades Gradiente, que fica disponível ao progredir na história.",
    image: "Monoco_MightyStrike.webp"
  },
  {
    id: "monoco-moissonneuse-vendange",
    character: "monoco",
    name: "Moissonneuse Vendange",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Harvesting reaper attack.\n\nEfeito: Causa dano Físico alto em alvo único. 3 acertos. Pode causar quebra. Dano aumentado quando Máscara Equilibrada ou Máscara Onipotente está ativa no Ponteiro da Roda Bestial. Usar esta habilidade avança o ponteiro em 2 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Moissoneusse enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_MoissonneuseVendange.webp"
  },
  {
    id: "monoco-obscur-sword",
    character: "monoco",
    name: "Obscur Sword",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Dark shadow sword attack.\n\nEfeito: Causa dano das Trevas alto em alvo único. 5 acertos. Causa mais dano contra alvos Indefesos. Máscara Pesada: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Obscur enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_ObscurSword.webp"
  },
  {
    id: "monoco-orphelin-cheers",
    character: "monoco",
    name: "Orphelin Cheers",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Orphan's cheerful buff.\n\nEfeito: Aplica Fortalecido em 1-3 aliados. Máscara de Conjurador: Também concede 3 PM aos alvos. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições. Quando o ponteiro está em Máscara de Conjurador ou Máscara Onipotente, aliados afetados recebem benefícios triplicados.\nPré-requisito: Derrote e adquira o pé de um inimigo Orphelin enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_OrphelinCheers.webp"
  },
  {
    id: "monoco-pelerin-heal",
    character: "monoco",
    name: "Pelerin Heal",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Pilgrim's healing skill.\n\nEfeito: Aplica Regeneração em todos os aliados. Máscara de Conjurador: também cura 40% de Vida. Usar esta habilidade avança o Ponteiro da Roda Bestial em 3 posições. Quando o ponteiro está em Máscara de Conjurador ou Máscara Onipotente, o time recebe um aumento de cura de 40%.\nPré-requisito: Derrote e adquira o pé de um inimigo Pelerin enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_PelerinHeal.webp"
  },
  {
    id: "monoco-portier-crash",
    character: "monoco",
    name: "Portier Crash",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Door-breaking crash attack.\n\nEfeito: Causa dano Físico alto em todos os inimigos. 1 acerto. Pode causar quebra. Máscara Pesada: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Portier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_PortierCrash.webp"
  },
  {
    id: "monoco-potier-energy",
    character: "monoco",
    name: "Potier Energy",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Potter's energy skill.\n\nEfeito: Concede 1-3 PM a todos os aliados. Com aprimoramento de Máscara de Conjurador, fornece 1 PM adicional. Usar esta habilidade avança o Ponteiro da Roda Bestial em 6 posições. Quando ativado em Máscara de Conjurador ou Máscara Onipotente, aliados recebem um PM extra.\nPré-requisito: Derrote e adquira o pé de um inimigo Potier enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_PotierEnergy.webp"
  },
  {
    id: "monoco-ramasseur-bonk",
    character: "monoco",
    name: "Ramasseur Bonk",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Collector's bonking attack.\n\nEfeito: Causa dano das Trevas baixo em alvo único. 1 acerto. Pode causar quebra. Efeito Máscara Ágil preenche 20% da Barra de Break do alvo. Move o Ponteiro da Roda Bestial em 4 posições. Quando usado enquanto o ponteiro está em Máscara Ágil ou Máscara Onipotente, preenche a Barra de Break do inimigo em 20% ao acertar.\nPré-requisito: Derrote e adquira o pé de um inimigo Ramasseur enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_RamasseurBonk.webp"
  },
  {
    id: "monoco-rocher-hammering",
    character: "monoco",
    name: "Rocher Hammering",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Rock hammering attack.\n\nEfeito: Causa dano Físico médio em alvo único. 4 acertos. Pode causar quebra. Modificador de Máscara Pesada fornece dano aumentado. Avança o Ponteiro da Roda Bestial em 3 posições e ganha dano aprimorado quando usado em Máscara Pesada ou Máscara Onipotente.\nPré-requisito: Derrote e adquira o pé de um inimigo Rocher enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_RocherHammering.webp"
  },
  {
    id: "monoco-sakapatate-estoc",
    character: "monoco",
    name: "Sakapatate Estoc",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Estoc thrusting attack.\n\nEfeito: Causa dano de Raio baixo em alvo único. 1 acerto. Causa mais dano se o alvo estiver Atordoado. Máscara Equilibrada: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Ranger Sakapatate enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_SakapatateEstoc.webp"
  },
  {
    id: "monoco-sakapatate-explosion",
    character: "monoco",
    name: "Sakapatate Explosion",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Explosive attack.\n\nEfeito: Causa dano de Raio médio em inimigos aleatórios. 3 acertos. Acertos Críticos acionam um acerto adicional. Máscara de Conjurador: Dano aumentado.\nPré-requisito: Derrote e adquira o pé de um inimigo Catapult Sakapatate enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_SakapatateExplosion.webp"
  },
  {
    id: "monoco-sakapatate-fire",
    character: "monoco",
    name: "Sakapatate Fire",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Fire-based attack.\n\nEfeito: Causa dano de Fogo extremo em todos os inimigos. 3 acertos. Aplica 3 Queimaduras por acerto (9 total possível). Máscara Onipotente: Dano aumentado. Roda Bestial: +1 posição. Combo ótimo: Sakapatate Fire → Sapling Absorption → skill intermediária → Sakapatate Fire.\nPré-requisito: Derrote e adquira o pé do inimigo Ultimate Sakapatate enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_SakapatateFire.webp"
  },
  {
    id: "monoco-sakapatate-slam",
    character: "monoco",
    name: "Sakapatate Slam",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Powerful slamming attack.\n\nEfeito: Causa dano Físico alto em todos os inimigos. 1 acerto. Dano aumentado contra alvos Marcados. Máscara Pesada ou Onipotente: Dano aumentado. Roda Bestial: +5 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Robust Sakapatate enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_SakapatateSlam.webp"
  },
  {
    id: "monoco-sanctuary",
    character: "monoco",
    name: "Sanctuary",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Creates protective sanctuary.\n\nEfeito: Habilidade Gradient (2 cargas). Concede 2 Escudos e aplica Regeneração em todos os aliados por 3 turnos. Não consome turno.\nPré-requisito: Alcance Nível de Relacionamento 4 com Monoco.",
    image: "Monoco_Sanctuary.webp"
  },
  {
    id: "monoco-sapling-absorption",
    character: "monoco",
    name: "Sapling Absorption",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Absorbs energy like a sapling.\n\nEfeito: Causa dano das Trevas alto. 3 acertos. Recupera 5% de Vida por acerto (10% na Máscara de Conjurador ou Onipotente). Roda Bestial: +5 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Sapling enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_SaplingAbsorption.webp"
  },
  {
    id: "monoco-stalact-punches",
    character: "monoco",
    name: "Stalact Punches",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Stalactite-like punching attacks.\n\nEfeito: Causa dano de Gelo médio em alvo único. 4 acertos. Alto dano de Break. Máscara Pesada ou Onipotente: Dano aumentado. Roda Bestial: +4 posições.\nPré-requisito: Habilidade inicial de Monoco ao se juntar ao grupo, não requer pré-requisito.",
    image: "Monoco_StalactPunches.webp"
  },
  {
    id: "monoco-troubadour-trumpet",
    character: "monoco",
    name: "Troubadour Trumpet",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    description: "Trumpet sound attack.\n\nEfeito: Aplica 1 buff aleatório em 1-3 aliados (Empowered, Protected, Shielded, Regeneration ou Hastened). Máscara de Conjurador ou Onipotente: aplica 2 buffs aleatórios por aliado. Roda Bestial: +4 posições.\nPré-requisito: Derrote e adquira o pé de um inimigo Troubadour enquanto Monoco estiver no grupo ativo.",
    image: "Monoco_TroubadourTrumpet.webp"
  }
];
