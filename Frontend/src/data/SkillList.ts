import type { SkillResponse } from "../api/ResponseModel";
import { t } from "../i18n";

// Base skill data without translations
const SkillsBaseData = [
  // ====================
  // GUSTAVE (8 skills)
  // ====================
  {
    id: "gustave-lumiere-assault",
    character: "gustave",
    cost: 3,
    unlockCost: 0,
    image: "Gustave_LumiereAssault.webp"
  },
  {
    id: "gustave-marking-shot",
    character: "gustave",
    cost: 2,
    unlockCost: 1,
    image: "Gustave_MarkingShot.webp",
    preRequisite: ["gustave-overcharge"]
  },
  {
    id: "gustave-overcharge",
    character: "gustave",
    cost: 4,
    unlockCost: 0,
    image: "Gustave_Overcharge.webp"
  },
  {
    id: "gustave-powerful",
    character: "gustave",
    cost: 3,
    unlockCost: 2,
    image: "Gustave_Powerful.webp",
    preRequisite: ["gustave-lumiere-assault"]
  },
  {
    id: "gustave-recovery",
    character: "gustave",
    cost: 3,
    unlockCost: 2,
    image: "Gustave_Recovery.webp",
    preRequisite: ["gustave-powerful"]
  },
  {
    id: "gustave-from-fire",
    character: "gustave",
    cost: 4,
    unlockCost: 2,
    image: "Gustave_FromFire.webp",
    preRequisite: ["gustave-marking-shot"]
  },
  {
    id: "gustave-shatter",
    character: "gustave",
    cost: 5,
    unlockCost: 6,
    image: "Gustave_Shatter.webp",
    preRequisite: ["gustave-recovery"]
  },
  {
    id: "gustave-strike-storm",
    character: "gustave",
    cost: 7,
    unlockCost: 10,
    image: "Gustave_StrikeStorm.webp",
    preRequisite: ["gustave-from-fire"]
  },

  // ====================
  // LUNE (25 skills)
  // ====================
  {
    id: "lune-electrify",
    character: "lune",
    cost: 1,
    unlockCost: 0,
    image: "Lune_Electrify.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-immolation",
    character: "lune",
    cost: 2,
    unlockCost: 0,
    image: "Lune_Immolation.webp"
  },
  {
    id: "lune-ice-lance",
    character: "lune",
    cost: 4,
    unlockCost: 0,
    image: "Lune_IceGust.webp"
  },
  {
    id: "lune-earth-rising",
    character: "lune",
    cost: 3,
    unlockCost: 1,
    image: "Lune_EarthRising.webp",
    preRequisite: ["lune-ice-lance"]
  },
  {
    id: "lune-thermal-transfer",
    character: "lune",
    cost: 2,
    unlockCost: 0,
    image: "Lune_ThermalTransfer.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-thunderfall",
    character: "lune",
    cost: 5,
    unlockCost: 0,
    image: "Lune_Thunderfall.webp",
    preRequisite: ["lune-immolation"]
  },
  {
    id: "lune-wildfire",
    character: "lune",
    cost: 4,
    unlockCost: 2,
    image: "Lune_Wildfire.webp",
    preRequisite: ["lune-thunderfall"]
  },
  {
    id: "lune-mayhem",
    character: "lune",
    cost: 3,
    unlockCost: 0,
    image: "Lune_Mayhem.webp",
    preRequisite: ["lune-electrify","lune-thermal-transfer"]
  },
  {
    id: "lune-elemental-trick",
    character: "lune",
    cost: 3,
    unlockCost: 4,
    image: "Lune_ElementalTrick.webp",
    preRequisite: ["lune-mayhem"]
  },
  {
    id: "lune-elemental-genesis",
    character: "lune",
    cost: 4,
    unlockCost: 10,
    image: "Lune_ElementalGenesis.webp",
    preRequisite: ["lune-elemental-trick"]
  },
  {
    id: "lune-crippling-tsunami",
    character: "lune",
    cost: 5,
    unlockCost: 6,
    image: "Lune_CripplingTsunami.webp",
    preRequisite: ["lune-thermal-transfer"]
  },
  {
    id: "lune-rockslide",
    character: "lune",
    cost: 5,
    unlockCost: 2,
    image: "Lune_Rockslide.webp",
    preRequisite: ["lune-earth-rising"]
  },
  {
    id: "lune-crustal-crush",
    character: "lune",
    cost: 7,
    unlockCost: 6,
    image: "Lune_CrustalCrush.webp",
    preRequisite: ["lune-rockslide"]
  },
  {
    id: "lune-healing-light",
    character: "lune",
    cost: 3,
    unlockCost: 0,
    image: "Lune_HealingLight.webp",
    preRequisite: ["lune-ice-lance","lune-immolation"]
  },
  {
    id: "lune-lightning-dance",
    character: "lune",
    cost: 7,
    unlockCost: 6,
    image: "Lune_LightningDance.webp",
    preRequisite: ["lune-electrify"]
  },
  {
    id: "lune-storm-caller",
    character: "lune",
    cost: 6,
    unlockCost: 8,
    image: "Lune_StormCaller.webp",
    preRequisite: ["lune-lightning-dance"]
  },
  {
    id: "lune-terraquake",
    character: "lune",
    cost: 5,
    unlockCost: 10,
    image: "Lune_Terraquake.webp",
    preRequisite: ["lune-crustal-crush"]
  },
  {
    id: "lune-typhoon",
    character: "lune",
    cost: 8,
    unlockCost: 8,
    image: "Lune_Typhoon.webp",
    preRequisite: ["lune-crippling-tsunami"]
  },
  {
    id: "lune-rebirth",
    character: "lune",
    cost: 5,
    unlockCost: 4,
    image: "Lune_Rebirth.webp",
    preRequisite: ["lune-healing-light"]
  },
  {
    id: "lune-revitalization",
    character: "lune",
    cost: 5,
    unlockCost: 6,
    image: "Lune_Revitalization.webp",
    preRequisite: ["lune-rebirth"]
  },
  {
    id: "lune-fire-rage",
    character: "lune",
    cost: 5,
    unlockCost: 6,
    image: "Lune_FireRage.webp",
    preRequisite: ["lune-wildfire"]
  },
  {
    id: "lune-hell",
    character: "lune",
    cost: 9,
    unlockCost: 10,
    image: "Lune_Hell.webp",
    preRequisite: ["lune-fire-rage"]
  },
  {
    id: "lune-sky-break",
    character: "lune",
    cost: 3,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Lune_SkyBreak.webp"
  },
  {
    id: "lune-tree-of-life",
    character: "lune",
    cost: 2,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Lune_TreeOfLife.webp"
  },
  {
    id: "lune-tremor",
    character: "lune",
    cost: 1,
    unlockCost: 0,
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
    cost: 1,
    unlockCost: 0,
    image: "Maelle_OffensiveSwitch.webp"
  },
  {
    id: "maelle-mezzo-forte",
    character: "maelle",
    cost: 1,
    unlockCost: 4,
    image: "Maelle_MezzoForte.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-percee",
    character: "maelle",
    cost: 5,
    unlockCost: 0,
    image: "Maelle_Percee.webp"
  },
  {
    id: "maelle-degagement",
    character: "maelle",
    cost: 2,
    unlockCost: 2,
    image: "Maelle_Degagement.webp",
    preRequisite: ["maelle-spark","maelle-guard-down"]
  },
  {
    id: "maelle-guard-up",
    character: "maelle",
    cost: 3,
    unlockCost: 2,
    image: "Maelle_GuardUp.webp",
    preRequisite: ["maelle-swift-stride"]
  },
  {
    id: "maelle-swift-stride",
    character: "maelle",
    cost: 3,
    unlockCost: 1,
    image: "Maelle_SwiftStride.webp",
    preRequisite: ["maelle-percee"]
  },
  {
    id: "maelle-guard-down",
    character: "maelle",
    cost: 3,
    unlockCost: 4,
    image: "Maelle_GuardDown.webp",
    preRequisite: ["maelle-guard-up","maelle-degagement"]
  },
  {
    id: "maelle-egide",
    character: "maelle",
    cost: 3,
    unlockCost: 4,
    image: "Maelle_Egide.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-spark",
    character: "maelle",
    cost: 3,
    unlockCost: 1,
    image: "Maelle_Spark.webp",
    preRequisite: ["maelle-offensive-switch"]
  },
  {
    id: "maelle-rain-of-fire",
    character: "maelle",
    cost: 5,
    unlockCost: 4,
    image: "Maelle_RainOfFire.webp",
    preRequisite: ["maelle-degagement"]
  },
  {
    id: "maelle-combustion",
    character: "maelle",
    cost: 4,
    unlockCost: 6,
    image: "Maelle_Combustion.webp",
    preRequisite: ["maelle-rain-of-fire"]
  },
  {
    id: "maelle-fleuret-fury",
    character: "maelle",
    cost: 6,
    unlockCost: 2,
    image: "Maelle_FleuretFury.webp",
    preRequisite: ["maelle-guard-up"]
  },
  {
    id: "maelle-breaking-rules",
    character: "maelle",
    cost: 3,
    unlockCost: 3,
    image: "Maelle_BreakingRules.webp",
    preRequisite: ["maelle-fleuret-fury"]
  },
  {
    id: "maelle-fencers-flurry",
    character: "maelle",
    cost: 4,
    unlockCost: 6,
    image: "Maelle_FencersFlurry.webp",
    preRequisite: ["maelle-breaking-rules"]
  },
  {
    id: "maelle-phantom-strike",
    character: "maelle",
    cost: 7,
    unlockCost: 4,
    image: "Maelle_PhantomStrike.webp",
    preRequisite: ["maelle-offensive-switch","maelle-burning-canvas"]
  },
  {
    id: "maelle-burning-canvas",
    character: "maelle",
    cost: 5,
    unlockCost: 6,
    image: "Maelle_BurningCanvas.webp",
    preRequisite: ["maelle-phantom-strike","maelle-stendhal"]
  },
  {
    id: "maelle-revenge",
    character: "maelle",
    cost: 5,
    unlockCost: 6,
    image: "Maelle_Revenge.webp",
    preRequisite: ["maelle-combustion"]
  },
  {
    id: "maelle-pyrolyse",
    character: "maelle",
    cost: 9,
    unlockCost: 8,
    image: "Maelle_Pyrolyse.webp",
    preRequisite: ["maelle-revenge"]
  },
  {
    id: "maelle-last-chance",
    character: "maelle",
    cost: 1,
    unlockCost: 6,
    image: "Maelle_LastChance.webp",
    preRequisite: ["maelle-mezzo-forte"]
  },
  {
    id: "maelle-momentum-strike",
    character: "maelle",
    cost: 7,
    unlockCost: 6,
    image: "Maelle_MomentumStrike.webp",
    preRequisite: ["maelle-egide"]
  },
  {
    id: "maelle-payback",
    character: "maelle",
    cost: 9,
    unlockCost: 8,
    image: "Maelle_Payback.webp",
    preRequisite: ["maelle-last-chance","maelle-momentum-strike"]
  },
  {
    id: "maelle-stendhal",
    character: "maelle",
    cost: 8,
    unlockCost: 4,
    image: "Maelle_Stendhal.webp",
    preRequisite: ["maelle-percee","maelle-burning-canvas"]
  },
  {
    id: "maelle-sword-ballet",
    character: "maelle",
    cost: 9,
    unlockCost: 10,
    image: "Maelle_SwordBallet.webp",
    preRequisite: ["maelle-fencers-flurry"]
  },
  {
    id: "maelle-gustaves-homage",
    character: "maelle",
    cost: 8,
    unlockCost: 8,
    masterUnlock: true,
    image: "Maelle_SpoilerSkill.webp"
  },
  {
    id: "maelle-virtuose-strike",
    character: "maelle",
    cost: 1,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Maelle_VirtuoseStrike.webp"
  },
  {
    id: "maelle-gommage",
    character: "maelle",
    cost: 3,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Maelle_SpoilerGradientAttack.webp"
  },
  {
    id: "maelle-phoenix-flame",
    character: "maelle",
    cost: 2,
    unlockCost: 0,
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
    cost: 2,
    unlockCost: 0,
    type: "moon",
    image: "Sciel_TwilightSlash.webp"
  },
  {
    id: "sciel-focused-foretell",
    character: "sciel",
    cost: 2,
    unlockCost: 0,
    type: "sun",
    image: "Sciel_FocusedForetell.webp"
  },
  {
    id: "sciel-bad-omen",
    character: "sciel",
    cost: 3,
    unlockCost: 4,
    type: "sun",
    image: "Sciel_BadOmen.webp",
    preRequisite: ["sciel-marking-card"]
  },
  {
    id: "sciel-marking-card",
    character: "sciel",
    cost: 3,
    unlockCost: 2,
    type: "sun",
    image: "Sciel_MarkingCard.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-delaying-slash",
    character: "sciel",
    cost: 5,
    unlockCost: 6,
    type: "moon",
    image: "Sciel_DelayingSlash.webp",
    preRequisite: ["sciel-bad-omen"]
  },
  {
    id: "sciel-dark-cleansing",
    character: "sciel",
    cost: 0,
    unlockCost: 2,
    type: "moon",
    image: "Sciel_DarkCleansing.webp",
    preRequisite: ["sciel-spectral-sweep"]
  },
  {
    id: "sciel-dark-wave",
    character: "sciel",
    cost: 6,
    unlockCost: 10,
    type: "moon",
    image: "Sciel_DarkWave.webp",
    preRequisite: ["sciel-grim-harvest","sciel-delaying-slash"]
  },
  {
    id: "sciel-grim-harvest",
    character: "sciel",
    cost: 5,
    unlockCost: 6,
    type: "moon",
    image: "Sciel_GrimHarvest.webp",
    preRequisite: ["sciel-sealed-fate"]
  },
  {
    id: "sciel-harvest",
    character: "sciel",
    cost: 3,
    unlockCost: 1,
    type: "moon",
    image: "Sciel_Harvest.webp",
    preRequisite: ["sciel-twilight-slash"]
  },
  {
    id: "sciel-searing-bond",
    character: "sciel",
    cost: 4,
    unlockCost: 2,
    type: "sun",
    image: "Sciel_SearingBond.webp",
    preRequisite: ["sciel-harvest"]
  },
  {
    id: "sciel-phantom-blade",
    character: "sciel",
    cost: 5,
    unlockCost: 2,
    type: "moon",
    image: "Sciel_PhantomBlade.webp",
    preRequisite: ["sciel-twilight-slash"]
  },
  {
    id: "sciel-sealed-fate",
    character: "sciel",
    cost: 4,
    unlockCost: 4,
    type: "moon",
    image: "Sciel_SealedFate.webp",
    preRequisite: ["sciel-phantom-blade"]
  },
  {
    id: "sciel-spectral-sweep",
    character: "sciel",
    cost: 7,
    unlockCost: 2,
    type: "sun",
    image: "Sciel_SpectralSweep.webp",
    preRequisite: ["sciel-rush"]
  },
  {
    id: "sciel-firing-shadow",
    character: "sciel",
    cost: 3,
    unlockCost: 2,
    type: "moon",
    image: "Sciel_FiringShadow.webp",
    preRequisite: ["sciel-searing-bond"]
  },
  {
    id: "sciel-fortunes-fury",
    character: "sciel",
    cost: 5,
    unlockCost: 6,
    type: "sun",
    image: "Sciel_FortunesFury.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-our-sacrifice",
    character: "sciel",
    cost: 4,
    unlockCost: 8,
    type: "moon",
    image: "Sciel_OurSacrifice.webp",
    preRequisite: ["sciel-fortunes-fury"]
  },
  {
    id: "sciel-plentiful-harvest",
    character: "sciel",
    cost: 4,
    unlockCost: 4,
    type: "moon",
    image: "Sciel_PlentifulHarvest.webp",
    preRequisite: ["sciel-firing-shadow"]
  },
  {
    id: "sciel-rush",
    character: "sciel",
    cost: 3,
    unlockCost: 2,
    type: "sun",
    image: "Sciel_Rush.webp",
    preRequisite: ["sciel-focused-foretell"]
  },
  {
    id: "sciel-all-set",
    character: "sciel",
    cost: 6,
    unlockCost: 6,
    type: "sun",
    image: "Sciel_AllSet.webp",
    preRequisite: ["sciel-card-weaver"]
  },
  {
    id: "sciel-intervention",
    character: "sciel",
    cost: 5,
    unlockCost: 6,
    type: "moon",
    image: "Sciel_Intervention.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-card-weaver",
    character: "sciel",
    cost: 3,
    unlockCost: 4,
    type: "sun",
    image: "Sciel_CardWeaver.webp",
    preRequisite: ["sciel-dark-cleansing"]
  },
  {
    id: "sciel-final-path",
    character: "sciel",
    cost: 9,
    unlockCost: 10,
    type: "sun",
    image: "Sciel_FinalPath.webp",
    isBlocked: true,
    preRequisite: ["sciel-dark-wave"]
  },
  {
    id: "sciel-twilight-dance",
    character: "sciel",
    cost: 9,
    unlockCost: 10,
    type: "moon",
    image: "Sciel_TwilightDance.webp",
    preRequisite: ["sciel-final-path","sciel-all-set","sciel-our-sacrifice"]
  },
  {
    id: "sciel-shadow-bringer",
    character: "sciel",
    cost: 1,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    type: "sun",
    image: "Sciel_ShadowBringer.webp"
  },
  {
    id: "sciel-doom",
    character: "sciel",
    cost: 2,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    type: "moon",
    image: "Sciel_Doom.webp"
  },
  {
    id: "sciel-end-slice",
    character: "sciel",
    cost: 3,
    unlockCost: 0,
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
    cost: 3,
    unlockCost: 3,
    isGradient: true,
    masterUnlock: true,
    image: "Verso_AngelsEyes.webp"
  },
  {
    id: "verso-ascending-assault",
    character: "verso",
    cost: 5,
    unlockCost: 4,
    preRequisite: ["verso-blitz"],
    image: "Verso_AscendingAssault.webp"
  },
  {
    id: "verso-assault-zero",
    character: "verso",
    cost: 3,
    unlockCost: 0,
    image: "Verso_AssaultZero.webp"
  },
  {
    id: "verso-berserk-slash",
    character: "verso",
    cost: 4,
    unlockCost: 2,
    preRequisite: ["verso-quick-strike"],
    image: "Verso_BerserkSlash.webp"
  },
  {
    id: "verso-blitz",
    character: "verso",
    cost: 3,
    unlockCost: 2,
    preRequisite: ["verso-purification"],
    image: "Verso_Blitz.webp"
  },
  {
    id: "verso-burden",
    character: "verso",
    cost: 1,
    unlockCost: 4,
    preRequisite: ["verso-berserk-slash"],
    image: "Verso_Burden.webp"
  },
  {
    id: "verso-defiant-strike",
    character: "verso",
    cost: 3,
    unlockCost: 6,
    preRequisite: ["verso-berserk-slash"],
    image: "Verso_DefiantStrike.webp"
  },
  {
    id: "verso-endbringer",
    character: "verso",
    cost: 9,
    unlockCost: 10,
    preRequisite: ["verso-light-holder", "verso-steeled-strike"],
    image: "Verso_Endbringer.webp"
  },
  {
    id: "verso-followup",
    character: "verso",
    cost: 5,
    unlockCost: 4,
    preRequisite: ["verso-purification"],
    image: "Verso_Followup.webp"
  },
  {
    id: "verso-from-fire",
    character: "verso",
    cost: 4,
    unlockCost: 0,
    image: "Verso_FromFire.webp"
  },
  {
    id: "verso-leadership",
    character: "verso",
    cost: 3,
    unlockCost: 4,
    preRequisite: ["verso-powerful"],
    image: "Verso_Leadership.webp"
  },
  {
    id: "verso-light-holder",
    character: "verso",
    cost: 4,
    unlockCost: 6,
    preRequisite: ["verso-radiant-slash"],
    image: "Verso_LightHolder.webp"
  },
  {
    id: "verso-marking-shot",
    character: "verso",
    cost: 3,
    unlockCost: 3,
    image: "Verso_MarkingShot.webp"
  },
  {
    id: "verso-overload",
    character: "verso",
    cost: 0,
    unlockCost: 6,
    preRequisite: ["verso-followup", "verso-speedburst"],
    image: "Verso_Overload.webp"
  },
  {
    id: "verso-paradigm-shift",
    character: "verso",
    cost: 1,
    unlockCost: 2,
    preRequisite: ["verso-purification", "verso-quick-strike"],
    image: "Verso_ParadigmShift.webp"
  },
  {
    id: "verso-perfect-break",
    character: "verso",
    cost: 7,
    unlockCost: 4,
    preRequisite: ["verso-blitz", "verso-berserk-slash"],
    image: "Verso_PerfectBreak.webp"
  },
  {
    id: "verso-perfect-recovery",
    character: "verso",
    cost: 3,
    unlockCost: 1,
    preRequisite: ["verso-from-fire"],
    image: "Verso_PerfectRecovery.webp"
  },
  {
    id: "verso-phantom-stars",
    character: "verso",
    cost: 9,
    unlockCost: 8,
    preRequisite: ["verso-burden"],
    image: "Verso_PhantomStars.webp"
  },
  {
    id: "verso-powerful",
    character: "verso",
    cost: 3,
    unlockCost: 2,
    preRequisite: ["verso-quick-strike"],
    image: "Verso_Powerful.webp"
  },
  {
    id: "verso-purification",
    character: "verso",
    cost: 5,
    unlockCost: 2,
    preRequisite: ["verso-perfect-recovery"],
    image: "Verso_Purification.webp"
  },
  {
    id: "verso-quick-strike",
    character: "verso",
    cost: 2,
    unlockCost: 2,
    preRequisite: ["verso-marking-shot"],
    image: "Verso_QuickStrike.webp"
  },
  {
    id: "verso-radiant-slash",
    character: "verso",
    cost: 2,
    unlockCost: 4,
    preRequisite: ["verso-blitz"],
    image: "Verso_RadiantSlash.webp"
  },
  {
    id: "verso-sabotage",
    character: "verso",
    cost: 1,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Verso_Sabotage.webp"
  },
  {
    id: "verso-speedburst",
    character: "verso",
    cost: 6,
    unlockCost: 6,
    preRequisite: ["verso-ascending-assault", "verso-overload"],
    image: "Verso_Speedburst.webp"
  },
  {
    id: "verso-steeled-strike",
    character: "verso",
    cost: 9,
    unlockCost: 10,
    preRequisite: ["verso-strike-storm", "verso-endbringer"],
    image: "Verso_SteeledStrike.webp"
  },
  {
    id: "verso-striker",
    character: "verso",
    cost: 2,
    unlockCost: 0,
    isGradient: true,
    masterUnlock: true,
    image: "Verso_Striker.webp"
  },
  {
    id: "verso-strike-storm",
    character: "verso",
    cost: 7,
    unlockCost: 10,
    preRequisite: ["verso-from-fire"],
    image: "Verso_Strikestorm.webp"
  },

  // ====================
  // MONOCO (48 skills)
  // ====================
  {
    id: "monoco-abbest-wind",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_AbbestWind.webp"
  },
  {
    id: "monoco-aberration-light",
    character: "monoco",
    cost: 7,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_AberrationLight.webp"
  },
  {
    id: "monoco-ballet-charm",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_BalletCharm.webp"
  },
  {
    id: "monoco-benisseur-mortar",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_BenisseurMortar.webp"
  },
  {
    id: "monoco-boucheclier-fortify",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_BoucheclierFortify.webp"
  },
  {
    id: "monoco-braseleur-smash",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_BraseleurSmash.webp"
  },
  {
    id: "monoco-break-point",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    isGradient: true,
    image: "Monoco_BreakPoint.webp"
  },
  {
    id: "monoco-bruler-bash",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_BrulerBash.webp"
  },
  {
    id: "monoco-chalier-combo",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ChalierCombo.webp"
  },
  {
    id: "monoco-chapelier-slash",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ChapelierSlash.webp"
  },
  {
    id: "monoco-chevaliere-ice",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ChevaliereIce.webp"
  },
  {
    id: "monoco-chevaliere-piercing",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ChevalierePiercing.webp"
  },
  {
    id: "monoco-chevaliere-thrusts",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ChevaliereThrusts.webp"
  },
  {
    id: "monoco-clair-enfeeble",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ClairEnfeeble.webp"
  },
  {
    id: "monoco-contorsionniste-blast",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ContorsionnisteBlast.webp"
  },
  {
    id: "monoco-creation-void",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_CreationVoid.webp"
  },
  {
    id: "monoco-cruler-barrier",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_CrulerBarrier.webp"
  },
  {
    id: "monoco-cultist-blood",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_CultistBlood.webp"
  },
  {
    id: "monoco-cultist-slashes",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_CultistSlashes.webp"
  },
  {
    id: "monoco-danseuse-waltz",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_DanseuseWaltz.webp"
  },
  {
    id: "monoco-demineur-thunder",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_DemineurThunder.webp"
  },
  {
    id: "monoco-duallist-storm",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_DuallistStorm.webp"
  },
  {
    id: "monoco-echassier-stabs",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_EchassierStabs.webp"
  },
  {
    id: "monoco-eveque-spear",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_EvequeSpear.webp"
  },
  {
    id: "monoco-gault-fury",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_GaultFury.webp"
  },
  {
    id: "monoco-glaise-earthquakes",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_GlaiseEarthquakes.webp"
  },
  {
    id: "monoco-hexga-crush",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_HexgaCrush.webp"
  },
  {
    id: "monoco-jar-lampstorm",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_JarLampstorm.webp"
  },
  {
    id: "monoco-lampmaster-light",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_LampmasterLight.webp"
  },
  {
    id: "monoco-lancelier-impale",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_LancelierImpale.webp"
  },
  {
    id: "monoco-luster-slices",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_LusterSlices.webp"
  },
  {
    id: "monoco-mighty-strike",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_MightyStrike.webp"
  },
  {
    id: "monoco-moissonneuse-vendange",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_MoissonneuseVendange.webp"
  },
  {
    id: "monoco-obscur-sword",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_ObscurSword.webp"
  },
  {
    id: "monoco-orphelin-cheers",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_OrphelinCheers.webp"
  },
  {
    id: "monoco-pelerin-heal",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_PelerinHeal.webp"
  },
  {
    id: "monoco-portier-crash",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_PortierCrash.webp"
  },
  {
    id: "monoco-potier-energy",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_PotierEnergy.webp"
  },
  {
    id: "monoco-ramasseur-bonk",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_RamasseurBonk.webp"
  },
  {
    id: "monoco-rocher-hammering",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_RocherHammering.webp"
  },
  {
    id: "monoco-sakapatate-estoc",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_SakapatateEstoc.webp"
  },
  {
    id: "monoco-sakapatate-explosion",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_SakapatateExplosion.webp"
  },
  {
    id: "monoco-sakapatate-fire",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_SakapatateFire.webp"
  },
  {
    id: "monoco-sakapatate-slam",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_SakapatateSlam.webp"
  },
  {
    id: "monoco-sanctuary",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_Sanctuary.webp"
  },
  {
    id: "monoco-sapling-absorption",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_SaplingAbsorption.webp"
  },
  {
    id: "monoco-stalact-punches",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_StalactPunches.webp"
  },
  {
    id: "monoco-troubadour-trumpet",
    character: "monoco",
    cost: 3,
    unlockCost: 0,
    masterUnlock: true,
    image: "Monoco_TroubadourTrumpet.webp"
  }
]

// Function to get skills with translations
export function getTranslatedSkills(): SkillResponse[] {
  return SkillsBaseData.map(skill => ({
    ...skill,
    name: t(`skills.${skill.id}.name`),
    description: t(`skills.${skill.id}.description`)
  }));
}

// For backward compatibility
export const SkillsList: SkillResponse[] = getTranslatedSkills();
