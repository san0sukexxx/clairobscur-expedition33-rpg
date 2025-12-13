import type { PictoInfo } from "../api/ResponseModel";

export const PictosList: PictoInfo[] = [
    {
        name: "Energy Master",
        status: {
            health: 2245
        },
        description: "Every AP gain is increased by 1.",
        color: "green",
        luminaCost: 30
    },
    {
        name: "Energising Turn",
        status: {
            speed: 532
        },
        description: "+1 AP on turn start.",
        color: "green",
        luminaCost: 32
    },
    {
        name: "Energising Attack I",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "+1 AP on Base Attack.",
        color: "green",
        luminaCost: 33
    },
    {
        name: "Energising Parry",
        status: {
            health: 2666
        },
        description: "+1 AP on successful Parry.",
        color: "green",
        luminaCost: 34
    },
    {
        name: "Augmented First Strike",
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: "50% increased damage on the first hit. Once per battle.",
        color: "red",
        luminaCost: 35
    },
    {
        name: "Survivor",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "Survive fatal damage with 1 Health. Once per battle.",
        color: "blue",
        luminaCost: 36
    },
    {
        name: "Aegis Revival",
        status: {
            defense: 681,
            speed: 280
        },
        description: "+1 Shield on being revived.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Recovery",
        status: {
            health: 2000,
            defense: 324
        },
        description: "Recovers 10% Health on turn start.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Lucky Aim",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "30% chance to recover 1 AP on hitting a Weak Point.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Augmented Counter I",
        status: {
            health: 2000,
            criticalRate: 11
        },
        description: "50% increased Counterattack damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Second Chance",
        status: {
            health: 1684,
            criticalRate: 10
        },
        description: "Revive with 100% Health. Once per battle.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "First Strike",
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: "Play first.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Solo Fighter",
        status: {
            health: 1403,
            defense: 681
        },
        description: "Deal 50% more damage if fighting alone.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Teamwork",
        status: {
            health: 1403,
            defense: 681
        },
        description: "10% increased damage while all allies are alive.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Sweet Kill",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "Recover 50% Health on killing an enemy.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Augmented Attack",
        status: {
            defense: 681,
            speed: 280
        },
        description: "50% increased Base Attack damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Attack Lifesteal",
        status: {
            health: 1333,
            criticalRate: 22
        },
        description: "Recover 15% Health on Base Attack.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Augmented Aim",
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: "50% increased Free Aim damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Combo Attack I",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "Base Attack has 1 extra hit.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Healing Parry",
        status: {
            health: 1403,
            defense: 681
        },
        description: "Recover 3% Health on Parry.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Auto Powerful",
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: "Apply Powerful for 3 turns on battle start.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Auto Shell",
        status: {
            health: 2666
        },
        description: "Apply Shell for 3 turns on battle start.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Auto Rush",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "Apply Rush for 3 turns on battle start.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Auto Regen",
        status: {
            defense: 1294
        },
        description: "Apply Regen for 3 turns on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Anti-Burn",
        status: {
            health: 1333,
            defense: 647
        },
        description: "Immune to Burn.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti-Freeze",
        status: {
            health: 1333,
            defense: 647
        },
        description: "Immune to Freeze.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti-Stun",
        status: {
            health: 1333,
            defense: 647
        },
        description: "Immune to Stun.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti Inverted",
        status: {},
        description: "Can't be Inverted.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti Curse",
        status: {},
        description: "Can't be Cursed.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti Bound",
        status: {},
        description: "Can't be Bound.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Anti Dizzy",
        status: {},
        description: "Can't be Dizzied.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Physical Coat",
        status: {},
        description: "Resist to Physical damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Fire Coat",
        status: {},
        description: "Resist to Fire damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Ice Coat",
        status: {},
        description: "Resist to Ice damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Thunder Coat",
        status: {},
        description: "Resist to Lightning damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Earth Coat",
        status: {},
        description: "Resist to Earth damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Light Coat",
        status: {},
        description: "Resist to Light damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Dark Coat",
        status: {},
        description: "Resist to Dark damage.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Back At You",
        status: {},
        description: "50% increased Counter Attack damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Dodger",
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: "Gain 1 AP on Perfect Dodge. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Start I",
        status: {
            health: 2666
        },
        description: "+1 AP on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Start II",
        status: {
            health: 2666
        },
        description: "+1 AP on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Start III",
        status: {
            health: 2666
        },
        description: "+1 AP on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Start IV",
        status: {
            health: 2666
        },
        description: "+1 AP on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Perilous Parry",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "+1 AP on Parry, but damage received is doubled.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Confident",
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: "Take 50% less damage, but can't be Healed.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Bloody Bullet",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "+1 AP on Weak Point hit.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Revive",
        status: {
            health: 1403,
            defense: 681
        },
        description: "+3 AP to all allies when revived.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Rejuvenating Revive",
        status: {
            health: 1403,
            defense: 681
        },
        description: "Apply Regen for 3 turns when revived.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Revive With Shell",
        status: {},
        description: "Apply Shell for 3 turns on revive.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Solidifying",
        status: {
            defense: 647,
            speed: 266
        },
        description: "+2 Shields when the character's Health falls below 50%. Once per battle.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Powerful Revive",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "Apply Powerful for 3 turns when revived.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Revive With Rush",
        status: {},
        description: "Apply Rush for 3 turns on revive.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "The One",
        status: {
            criticalRate: 69
        },
        description: "Max Health is reduced to 1.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Dead Energy II",
        status: {
            speed: 140,
            criticalRate: 35
        },
        description: "+3 AP on killing an enemy.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Frozen Shot",
        status: {},
        description: "Free Aim shots can Freeze.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Piercing Shot",
        status: {
            health: 1403,
            criticalRate: 23
        },
        description: "25% increased Free Aim damage. Free Aim shots ignore Shields.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Burning Dodge",
        status: {},
        description: "Successful Dodges can Burn the attacker.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Defense Breaker Dodge",
        status: {},
        description: "Successful Dodges can apply Defenseless to the attacker.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Defense Riser Dodge",
        status: {},
        description: "Successfully Dodging can apply Shell.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Hazardous Choice",
        status: {},
        description: "33% chance to skip own turn, but deal 50% more damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Healing Death",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "On death, the rest of the Expedition recover all Health.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Auto Death",
        status: {
            criticalRate: 60
        },
        description: "Kill self on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Auto Curse",
        status: {
            speed: 140,
            criticalRate: 35
        },
        description: "Self apply Curse on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Death Bomb",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "On Death, deal damage to all enemies.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Energising Death",
        status: {
            defense: 681,
            speed: 280
        },
        description: "On death, +4 AP to allies.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Shielding Death",
        status: {
            defense: 647,
            speed: 133
        },
        description: "On death, allies gain 3 Shield points.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Death",
        status: {
            health: 1333,
            speed: 266
        },
        description: "On death, allies gain Shell.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Empowering Death",
        status: {},
        description: "On death, allies gain Powerful.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Burn Affinity",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "25% increased damage on Burning targets.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Frozen Affinity",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "25% increased damage on Frozen targets.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Inverted Affinity",
        status: {
            health: 1403,
            criticalRate: 23
        },
        description: "Apply Inverted on self for 3 turns on battle start. 50% increased damage while Inverted.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Exhausting Power",
        status: {
            health: 1403,
            defense: 681
        },
        description: "50% increased damage if Exhausted.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Auto Burn",
        status: {
            speed: 560
        },
        description: "Self apply Burn on battle start.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "At Death's Door",
        status: {
            defense: 681,
            criticalRate: 23
        },
        description: "Deal 50% more damage if Health is below 10%.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Full Strength",
        status: {
            health: 1333,
            defense: 647
        },
        description: "25% increased damage on full Health.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Painted Power",
        status: {
            health: 2806
        },
        description: "Damage can exceed 9,999.",
        color: "yellow",
        luminaCost: 15
    },
    {
        name: "SOS Shell",
        status: {
            defense: 681,
            speed: 280
        },
        description: "Apply Shell when falling below 50% Health.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "SOS Power",
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: "Apply Powerful when falling below 50% Health.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Augmented Counter II",
        status: {
            defense: 647,
            criticalRate: 22
        },
        description: "50% increased Counterattack damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Augmented Counter III",
        status: {
            defense: 647,
            criticalRate: 22
        },
        description: "50% increased Counterattack damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Anti Exhaust",
        status: {},
        description: "Immune to Exhaust.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "SOS Rush",
        status: {
            defense: 681,
            speed: 280
        },
        description: "Apply Rush when falling below 50% Health.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Solidifying Meditation",
        status: {
            health: 2105,
            defense: 341
        },
        description: "+1 Shield when passing turn.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Double Burn",
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: "On applying a Burn stack, apply a second one.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Healing Fire",
        status: {
            defense: 647,
            speed: 266
        },
        description: "Recover 25% Health when attacking a Burning target. Once per turn.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Rewarding Mark",
        status: {
            defense: 1022,
            speed: 140
        },
        description: "+2 AP on dealing damage to a Marked target. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Double Mark",
        status: {
            speed: 532
        },
        description: "Mark requires 1 more hit to be removed.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Stun Boost",
        status: {
            speed: 479,
            criticalRate: 5
        },
        description: "30% increased damage on Stunned targets.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Sniper",
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: "First Free Aim shot each turn deals 200% increased damage and can Break.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Energising Attack II",
        status: {
            defense: 324,
            speed: 399
        },
        description: "+1 AP on Base Attack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Cheater",
        status: {
            health: 842,
            speed: 280
        },
        description: "Always play twice in a row.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Healing Counter",
        status: {
            health: 2666
        },
        description: "Recover 25% Health on Counterattack.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Powerful Shield",
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: "10% increased damage per Shield Point on self.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Base Shield",
        status: {
            speed: 378,
            criticalRate: 11
        },
        description: "+1 Shield if not affected by any Shield on turn start.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "In Medias Res",
        status: {
            defense: 971,
            criticalRate: 11
        },
        description: "+3 Shields on Battle Start, but max Health is halved.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Shield Breaker",
        status: {
            defense: 971,
            criticalRate: 11
        },
        description: "All hits break 1 more Shield.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Shield Affinity",
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: "30% increased damage while having Shields, but receiving any damage always removes all Shields.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Critical Moment",
        status: { speed: 280, criticalRate: 23 },
        description: "50% increased Critical Chance if Health is below 30%.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Warming Up",
        status: { health: 2000, criticalRate: 11 },
        description: "5% increased damage per turn. Can stack up to 5 times.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Glass Canon",
        status: { speed: 532 },
        description: "Deal 25% more damage, but take 25% more damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Faster Than Strong",
        status: { health: 1333, defense: 647 },
        description: "Always play twice in a row, but deal 50% less damage.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Shortcut",
        status: { speed: 280, criticalRate: 23 },
        description: "Immediately play when falling below 30% Health. Once per battle.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Defensive Mode",
        status: { health: 1403, defense: 681 },
        description: "On receiving damage, consume 1 AP to take 30% less damage, if possible.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Greater Powerful",
        status: { speed: 133, criticalRate: 33 },
        description: "+15% to Powerful damage increase.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Greater Shell",
        status: { health: 1333, defense: 647 },
        description: "+10% to Shell damage reduction.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Revive Paradox",
        status: { speed: 280, criticalRate: 23 },
        description: "Play immediately when revived.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Greater Rush",
        status: { speed: 399, criticalRate: 11 },
        description: "+25% to Rush Speed increase.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Last Stand Critical",
        status: { health: 1403, defense: 681 },
        description: "100% Critical Chance while fighting alone.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Effective Heal",
        status: { health: 632, defense: 920 },
        description: "Double all Heals received.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Shared Care",
        status: { health: 1333, defense: 647 },
        description: "When Healing an ally, also Heal self for 50% of that value.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Powerful Heal",
        status: { health: 1403, speed: 280 },
        description: "Healing an ally also applies Powerful for 1 turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Accelerating Heal",
        status: { health: 1403, speed: 280 },
        description: "Healing an ally also applies Rush for 1 turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Heal",
        status: { health: 1333, speed: 266 },
        description: "On Healing an ally, also give 2 AP.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Heal",
        status: { health: 1403, speed: 280 },
        description: "Healing an ally also applies Shell for 1 turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Confident Fighter",
        status: { health: 667, criticalRate: 33 },
        description: "30% increased damage, but can't be Healed.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Healing Share",
        status: { health: 1403, criticalRate: 23 },
        description: "Receive 15% of all Heals affecting other characters.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Dead Energy I",
        status: { speed: 280, criticalRate: 23 },
        description: "+3 AP on killing an enemy.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Effective Support",
        status: { health: 1403, speed: 280 },
        description: "+2 AP on using an item.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Weakness Gain",
        status: { speed: 280, criticalRate: 23 },
        description: "+1 AP on hitting an enemy's Weakness. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Patient Fighter",
        status: {},
        description: "+2 AP on skipping a turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energetic Healer",
        status: { defense: 647, speed: 266 },
        description: "+2 AP on Healing an ally. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Beneficial Contamination",
        status: { defense: 647, speed: 266 },
        description: "+2 AP on applying a Status Effect. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Perfect Reward",
        status: {},
        description: "Perfect Rythms give 1 AP.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Roulette",
        status: { defense: 681, criticalRate: 23 },
        description: "Every hit has a 50% chance to deal either 50% or 200% of its damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Soul Eater",
        status: { criticalRate: 46 },
        description: "Deal 30% more damage, but lose 20% Health per turn.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Painter",
        status: { speed: 266, criticalRate: 22 },
        description: "Convert all Physical damage to Void damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Immaculate",
        status: { speed: 266, criticalRate: 22 },
        description: "30% increased damage until a hit is received.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Tainted",
        status: { defense: 1022, criticalRate: 12 },
        description: "15% increased damage for each Status Effect on self.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "First Offensive",
        status: { speed: 266, criticalRate: 22 },
        description: "First hit dealt and taken deals 50% more damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Cursed Power",
        status: { health: 702, speed: 280, criticalRate: 12 },
        description: "30% increased damage while Cursed.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Pro Retreat",
        status: { health: 1123, speed: 224 },
        description: "Allows Flee to be instantaneous.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Enfeebling Mark",
        status: { defense: 971, speed: 133 },
        description: "Marked targets deal 30% less damage.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Burning Mark",
        status: { health: 667, defense: 971 },
        description: "Apply Burn on hitting a Marked enemy.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Powerful Mark",
        status: { speed: 399, criticalRate: 11 },
        description: "Gain Powerful on hitting a Marked enemy.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Healing Mark",
        status: { defense: 1294 },
        description: "Recover 25% Health on hitting a Marked enemy. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Stay Marked",
        status: { speed: 346, criticalRate: 16 },
        description: "50% chance to apply Mark when attacking a Marked target.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charybde To Scylla",
        status: { speed: 280, criticalRate: 23 },
        description: "Apply Mark on Stun removed.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Burning Shots",
        status: { speed: 504, criticalRate: 5 },
        description: "20% chance to Burn on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Free Aim Inverted Shot",
        status: { speed: 504, criticalRate: 5 },
        description: "Free Aim shots can apply Inverted.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Marking Shots",
        status: { speed: 504, criticalRate: 5 },
        description: "20% chance to apply Mark on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Powerful Shots",
        status: { health: 2526, defense: 137 },
        description: "20% chance to gain Powerful on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Shots",
        status: { health: 2526, defense: 137 },
        description: "20% chance to gain Shell on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Accelerating Shots",
        status: { health: 2526, defense: 137 },
        description: "20% chance to gain Rush on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Shots",
        status: { speed: 399, criticalRate: 11 },
        description: "20% chance to gain 1 AP on Free Aim shot.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Versatile",
        status: { speed: 420, criticalRate: 12 },
        description: "After a Free Aim hit, Base Attack damage is increased by 50% for 1 turn.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Empowering Attack",
        status: { speed: 399, criticalRate: 11 },
        description: "Gain Powerful for 1 turn on Base Attack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Attack",
        status: { health: 2000, defense: 324 },
        description: "Gain Shell for 1 turn on Base Attack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Enfeebling Attack",
        status: { health: 667, defense: 971 },
        description: "Base Attack applies Powerless for 1 turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Exposing Attack",
        status: { speed: 399, criticalRate: 11 },
        description: "Base Attack applies Defenseless for 1 turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Empowering Parry",
        status: { speed: 280, criticalRate: 23 },
        description: "Each successful Parry increases damage by 5% until end of the following turn. Taking any damage removes this buff.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Accelerating Last Stand",
        status: { health: 1403, speed: 280 },
        description: "Gain Rush if fighting alone.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Empowering Last Stand",
        status: { health: 1403, criticalRate: 23 },
        description: "Gain Powerful if fighting alone.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Last Stand",
        status: { health: 1403, defense: 681 },
        description: "Gain Shell if fighting alone.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Pain",
        status: { health: 2000, defense: 324 },
        description: "No longer gain AP on Parry. +1 AP on getting hit.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Jump",
        status: { health: 667, speed: 399 },
        description: "+1 AP on Jump Counterattack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Powered Attack",
        status: { speed: 399, criticalRate: 11 },
        description: "On every damage dealt, try to consume 1 AP. If successful, increase damage by 20%.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Combo Attack II",
        status: { speed: 399, criticalRate: 11 },
        description: "Base Attack has 1 extra hit.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Combo Attack III",
        status: { speed: 399, criticalRate: 11 },
        description: "Base Attack has 1 extra hit.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Breaker",
        status: { speed: 280, criticalRate: 23 },
        description: "25% increased Break damage.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Staggering Attack",
        status: { speed: 420, criticalRate: 12 },
        description: "50% increased Break damage on Base Attack.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Energising Break",
        status: { speed: 280, criticalRate: 23 },
        description: "+3 AP on Breaking a target.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Quick Break",
        status: { speed: 280, criticalRate: 23 },
        description: "Play again on Breaking a target.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Empowering Break",
        status: { speed: 280, criticalRate: 23 },
        description: "Gain Powerful on Breaking a target.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Breaking Shots",
        status: { speed: 280, criticalRate: 23 },
        description: "50% increased Break damage with Free Aim shots.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Fueling Break",
        status: { speed: 280, criticalRate: 23 },
        description: "Breaking a target doubles its Burn amount.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Gradient Fighter",
        status: { speed: 280, criticalRate: 23 },
        description: "25% increased damage with Gradient Attacks.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Gradient Recovery",
        status: { health: 1403, criticalRate: 23 },
        description: "Recover 10% Health on using a Gradient Charge.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Energising Gradient",
        status: { speed: 399, criticalRate: 11 },
        description: "+1 AP per Gradient Charge consumed.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Attack",
        status: { speed: 266, criticalRate: 22 },
        description: "+15% of a Gradient Charge on Base Attack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Gradient Breaker",
        status: { speed: 280, criticalRate: 23 },
        description: "50% increased Break damage with Gradient Attacks.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Post Gradient",
        status: {},
        description: "Play immediately after using a Gradient Attack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Recovery",
        status: { health: 1403, speed: 280 },
        description: "50% increased Gradient Generation with Healing Skills.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Counter",
        status: { health: 1333, defense: 647 },
        description: "+10% of a Gradient Charge on Counterattack.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Weakness",
        status: { speed: 280, criticalRate: 23 },
        description: "+15% of a Gradient Charge on hitting a Weakness. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Mark",
        status: { speed: 266, criticalRate: 22 },
        description: "+20% of a Gradient Charge on hitting a Marked target. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Revive Tint Energy",
        status: { health: 1333, defense: 647 },
        description: "Revive Tints also give 3 AP.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Healing Tint Energy",
        status: { health: 1403, defense: 681 },
        description: "Healing Tints also give 1 AP.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Empowering Tint",
        status: { health: 1403, speed: 280 },
        description: "Healing Tints also apply Powerful.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Protecting Tint",
        status: { health: 1403, defense: 681 },
        description: "Healing Tints also apply Shell.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Shielding Tint",
        status: { health: 1333, defense: 647 },
        description: "Healing Tints also add 2 Shields.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Accelerating Tint",
        status: { health: 1403, speed: 280 },
        description: "Healing Tints also apply Rush.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Better Healing Tint",
        status: { health: 1333, defense: 647 },
        description: "Healing Tints have double the Healing effect.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Cleansing Tint",
        status: { health: 1333, defense: 647 },
        description: "Healing Tints also remove all Status Effects from the target.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Great Healing Tint",
        status: { health: 1333, defense: 647 },
        description: "Healing Tints now affect the whole Expedition.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Great Energy Tint",
        status: { health: 1333, defense: 647 },
        description: "Energy Tints now affect the whole Expedition.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Tint",
        status: { health: 1403, defense: 681 },
        description: "+5% of a Gradient Charge on using an item.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Time Tint",
        status: { health: 1333, defense: 647 },
        description: "Energy Tints also apply Rush.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Burn",
        status: { defense: 324, speed: 266 },
        description: "+1 AP on applying Burn. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Breaking Burn",
        status: { speed: 420, criticalRate: 12 },
        description: "25% increased Break damage on Burning enemies.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Critical Burn",
        status: { speed: 266, criticalRate: 22 },
        description: "25% increased Critical Chance on Burning enemies.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Burning Death",
        status: { speed: 280, criticalRate: 23 },
        description: "Apply 3 Burn to all enemies on Death.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Longer Burn",
        status: { health: 1333, defense: 647 },
        description: "Burn duration is increased by 2.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Critical Break",
        status: { speed: 399, criticalRate: 11 },
        description: "25% increased Break damage on Critical hits.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Critical Weakness",
        status: { speed: 399, criticalRate: 11 },
        description: "25% increased Critical Chance on Weakness.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Critical Stun",
        status: { health: 1403, speed: 280 },
        description: "Increased critical hit chance against stunned enemies.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Critical Vulnerability",
        status: { defense: 647, speed: 266 },
        description: "25% increased Critical Chance on Defenceless enemies.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Empowering Dodge",
        status: { speed: 280, criticalRate: 23 },
        description: "5% increased damage for each consecutive successful Dodge. Can stack up to 10 times.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Marking Break",
        status: { speed: 280, criticalRate: 23 },
        description: "Apply Mark on Break.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Slowing Break",
        status: { defense: 681, speed: 280 },
        description: "Apply Slow on Break.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Longer Rush",
        status: { health: 1333, speed: 266 },
        description: "On applying Rush, its duration is increased by 2.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Powerful On Shell",
        status: { defense: 647, criticalRate: 22 },
        description: "Apply Powerful on applying Shell.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Rush On Powerful",
        status: { speed: 266, criticalRate: 22 },
        description: "Apply Rush on applying Powerful.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Shell On Rush",
        status: { defense: 647, speed: 266 },
        description: "Apply Shell on applying Rush.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Evasive Healer",
        status: { health: 1333, defense: 647 },
        description: "Heals provided are doubled until any damage is taken.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Powerful",
        status: { defense: 647, speed: 266 },
        description: "Give 2 AP on applying Powerful.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Shell",
        status: { defense: 647, speed: 266 },
        description: "Give 2 AP on applying Shell.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Rush",
        status: { defense: 647, speed: 266 },
        description: "Give 2 AP on applying Rush.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Healing Boon",
        status: { defense: 647, speed: 266 },
        description: "Heal 15% HP on applying a buff.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Greater Powerless",
        status: { defense: 647, speed: 266 },
        description: "+15% to Powerless damage reduction.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Greater Defenceless",
        status: { speed: 266, criticalRate: 22 },
        description: "+15% to Defenceless damage amplification.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Greater Slow",
        status: { defense: 647, speed: 266 },
        description: "+15% to Slow Speed reduction.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Energising Cleanse",
        status: { health: 2000, defense: 324 },
        description: "Dispel the first negative Status Effect received and gain 2 AP.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Draining Cleanse",
        status: { health: 2000, defense: 324 },
        description: "Consume 1 AP to prevent Status Effects application, if possible.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Anti-Blight",
        status: { health: 1333, defense: 647 },
        description: "Immune to Blight.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Charging Critical",
        status: { defense: 647, criticalRate: 22 },
        description: "+20% of a Gradient Charge on Critical Hit. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Burn",
        status: { health: 1333, speed: 266 },
        description: "+20% of a Gradient Charge on applying Burn. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Stun",
        status: { health: 1403, speed: 280 },
        description: "+5% of a Gradient Charge on hitting a Stunned enemy.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "Charging Alteration",
        status: { defense: 681, speed: 280 },
        description: "+10% of a Gradient Charge on applying a Buff. Once per turn.",
        color: "green",
        luminaCost: 15
    },
    {
        name: "The Best Defense",
        status: { defense: 1294 },
        description: "Deal 50% more damage, but can't Parry or Dodge.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Passive Defense",
        status: { health: 1403, criticalRate: 23 },
        description: "Reduce damage taken by 50%, but can't Parry or Dodge.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Successive Parry",
        status: { defense: 681, criticalRate: 23 },
        description: "Can't Dodge. +5% increased damage per Parry until damage taken.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Breaking Attack",
        status: { speed: 266, criticalRate: 22 },
        description: "Base Attack can Break.",
        color: "red",
        luminaCost: 15
    },
    {
        name: "Anti-Charm",
        status: { health: 1333, defense: 647 },
        description: "Immune to Charm.",
        color: "blue",
        luminaCost: 15
    },
    {
        name: "Clea's Life",
        status: { health: 2526 },
        description: "On turn start, if no damage taken since last turn, recover 100% Health.",
        color: "blue",
        luminaCost: 15
    }
];
