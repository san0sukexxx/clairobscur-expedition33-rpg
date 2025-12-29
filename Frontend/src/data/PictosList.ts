import type { PictoInfo } from "../api/ResponseModel";
import { getPictoName, getPictoDescription, getPictoEnglishName } from "../i18n";

export const PictosList: PictoInfo[] = [
    {
        id: "energy-master",
        imageId: getPictoEnglishName("energy-master"),
        name: getPictoName("energy-master"),
        status: {
            health: 2245
        },
        description: getPictoDescription("energy-master"),
        color: "green",
        luminaCost: 30,
        effectTriggers: ["on-turn-start", "on-attack", "on-parry", "on-dodge", "on-skill-use"]
    },
    {
        id: "energising-turn",
        imageId: getPictoEnglishName("energising-turn"),
        name: getPictoName("energising-turn"),
        status: {
            speed: 532
        },
        description: getPictoDescription("energising-turn"),
        color: "green",
        luminaCost: 32
    },
    {
        id: "energising-attack-i",
        imageId: getPictoEnglishName("energising-attack-i"),
        name: getPictoName("energising-attack-i"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("energising-attack-i"),
        color: "green",
        luminaCost: 33
    },
    {
        id: "energising-parry",
        imageId: getPictoEnglishName("energising-parry"),
        name: getPictoName("energising-parry"),
        status: {
            health: 2666
        },
        description: getPictoDescription("energising-parry"),
        color: "green",
        luminaCost: 34
    },
    {
        id: "augmented-first-strike",
        imageId: getPictoEnglishName("augmented-first-strike"),
        name: getPictoName("augmented-first-strike"),
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: getPictoDescription("augmented-first-strike"),
        color: "red",
        luminaCost: 35
    },
    {
        id: "survivor",
        imageId: getPictoEnglishName("survivor"),
        name: getPictoName("survivor"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("survivor"),
        color: "blue",
        luminaCost: 36
    },
    {
        id: "aegis-revival",
        imageId: getPictoEnglishName("aegis-revival"),
        name: getPictoName("aegis-revival"),
        status: {
            defense: 681,
            speed: 280
        },
        description: getPictoDescription("aegis-revival"),
        color: "green",
        luminaCost: 15,
        effectTriggers: ["on-revived"]
    },
    {
        id: "recovery",
        imageId: getPictoEnglishName("recovery"),
        name: getPictoName("recovery"),
        status: {
            health: 2000,
            defense: 324
        },
        description: getPictoDescription("recovery"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "lucky-aim",
        imageId: getPictoEnglishName("lucky-aim"),
        name: getPictoName("lucky-aim"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("lucky-aim"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "augmented-counter-i",
        imageId: getPictoEnglishName("augmented-counter-i"),
        name: getPictoName("augmented-counter-i"),
        status: {
            health: 2000,
            criticalRate: 11
        },
        description: getPictoDescription("augmented-counter-i"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "second-chance",
        imageId: getPictoEnglishName("second-chance"),
        name: getPictoName("second-chance"),
        status: {
            health: 1684,
            criticalRate: 10
        },
        description: getPictoDescription("second-chance"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "first-strike",
        imageId: getPictoEnglishName("first-strike"),
        name: getPictoName("first-strike"),
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: getPictoDescription("first-strike"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "solo-fighter",
        imageId: getPictoEnglishName("solo-fighter"),
        name: getPictoName("solo-fighter"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("solo-fighter"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "teamwork",
        imageId: getPictoEnglishName("teamwork"),
        name: getPictoName("teamwork"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("teamwork"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "sweet-kill",
        imageId: getPictoEnglishName("sweet-kill"),
        name: getPictoName("sweet-kill"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("sweet-kill"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "augmented-attack",
        imageId: getPictoEnglishName("augmented-attack"),
        name: getPictoName("augmented-attack"),
        status: {
            defense: 681,
            speed: 280
        },
        description: getPictoDescription("augmented-attack"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "attack-lifesteal",
        imageId: getPictoEnglishName("attack-lifesteal"),
        name: getPictoName("attack-lifesteal"),
        status: {
            health: 1333,
            criticalRate: 22
        },
        description: getPictoDescription("attack-lifesteal"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "augmented-aim",
        imageId: getPictoEnglishName("augmented-aim"),
        name: getPictoName("augmented-aim"),
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: getPictoDescription("augmented-aim"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "combo-attack-i",
        imageId: getPictoEnglishName("combo-attack-i"),
        name: getPictoName("combo-attack-i"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("combo-attack-i"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "healing-parry",
        imageId: getPictoEnglishName("healing-parry"),
        name: getPictoName("healing-parry"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("healing-parry"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "auto-powerful",
        imageId: getPictoEnglishName("auto-powerful"),
        name: getPictoName("auto-powerful"),
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: getPictoDescription("auto-powerful"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "auto-shell",
        imageId: getPictoEnglishName("auto-shell"),
        name: getPictoName("auto-shell"),
        status: {
            health: 2666
        },
        description: getPictoDescription("auto-shell"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "auto-rush",
        imageId: getPictoEnglishName("auto-rush"),
        name: getPictoName("auto-rush"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("auto-rush"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "auto-regen",
        imageId: getPictoEnglishName("auto-regen"),
        name: getPictoName("auto-regen"),
        status: {
            defense: 1294
        },
        description: getPictoDescription("auto-regen"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "anti-burn",
        imageId: getPictoEnglishName("anti-burn"),
        name: getPictoName("anti-burn"),
        status: {
            health: 1333,
            defense: 647
        },
        description: getPictoDescription("anti-burn"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-freeze",
        imageId: getPictoEnglishName("anti-freeze"),
        name: getPictoName("anti-freeze"),
        status: {
            health: 1333,
            defense: 647
        },
        description: getPictoDescription("anti-freeze"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-stun",
        imageId: getPictoEnglishName("anti-stun"),
        name: getPictoName("anti-stun"),
        status: {
            health: 1333,
            defense: 647
        },
        description: getPictoDescription("anti-stun"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-inverted",
        imageId: getPictoEnglishName("anti-inverted"),
        name: getPictoName("anti-inverted"),
        status: {},
        description: getPictoDescription("anti-inverted"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-curse",
        imageId: getPictoEnglishName("anti-curse"),
        name: getPictoName("anti-curse"),
        status: {},
        description: getPictoDescription("anti-curse"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-bound",
        imageId: getPictoEnglishName("anti-bound"),
        name: getPictoName("anti-bound"),
        status: {},
        description: getPictoDescription("anti-bound"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "anti-dizzy",
        imageId: getPictoEnglishName("anti-dizzy"),
        name: getPictoName("anti-dizzy"),
        status: {},
        description: getPictoDescription("anti-dizzy"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "physical-coat",
        imageId: getPictoEnglishName("physical-coat"),
        name: getPictoName("physical-coat"),
        status: {},
        description: getPictoDescription("physical-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "fire-coat",
        imageId: getPictoEnglishName("fire-coat"),
        name: getPictoName("fire-coat"),
        status: {},
        description: getPictoDescription("fire-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "ice-coat",
        imageId: getPictoEnglishName("ice-coat"),
        name: getPictoName("ice-coat"),
        status: {},
        description: getPictoDescription("ice-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "thunder-coat",
        imageId: getPictoEnglishName("thunder-coat"),
        name: getPictoName("thunder-coat"),
        status: {},
        description: getPictoDescription("thunder-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "earth-coat",
        imageId: getPictoEnglishName("earth-coat"),
        name: getPictoName("earth-coat"),
        status: {},
        description: getPictoDescription("earth-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "light-coat",
        imageId: getPictoEnglishName("light-coat"),
        name: getPictoName("light-coat"),
        status: {},
        description: getPictoDescription("light-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "dark-coat",
        imageId: getPictoEnglishName("dark-coat"),
        name: getPictoName("dark-coat"),
        status: {},
        description: getPictoDescription("dark-coat"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "back-at-you",
        imageId: getPictoEnglishName("back-at-you"),
        name: getPictoName("back-at-you"),
        status: {},
        description: getPictoDescription("back-at-you"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "dodger",
        imageId: getPictoEnglishName("dodger"),
        name: getPictoName("dodger"),
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: getPictoDescription("dodger"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-start-i",
        imageId: getPictoEnglishName("energising-start-i"),
        name: getPictoName("energising-start-i"),
        status: {
            health: 2666
        },
        description: getPictoDescription("energising-start-i"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-start-ii",
        imageId: getPictoEnglishName("energising-start-ii"),
        name: getPictoName("energising-start-ii"),
        status: {
            health: 2666
        },
        description: getPictoDescription("energising-start-ii"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-start-iii",
        imageId: getPictoEnglishName("energising-start-iii"),
        name: getPictoName("energising-start-iii"),
        status: {
            health: 2666
        },
        description: getPictoDescription("energising-start-iii"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-start-iv",
        imageId: getPictoEnglishName("energising-start-iv"),
        name: getPictoName("energising-start-iv"),
        status: {
            health: 2666
        },
        description: getPictoDescription("energising-start-iv"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "perilous-parry",
        imageId: getPictoEnglishName("perilous-parry"),
        name: getPictoName("perilous-parry"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("perilous-parry"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "confident",
        imageId: getPictoEnglishName("confident"),
        name: getPictoName("confident"),
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: getPictoDescription("confident"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "bloody-bullet",
        imageId: getPictoEnglishName("bloody-bullet"),
        name: getPictoName("bloody-bullet"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("bloody-bullet"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-revive",
        imageId: getPictoEnglishName("energising-revive"),
        name: getPictoName("energising-revive"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("energising-revive"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "rejuvenating-revive",
        imageId: getPictoEnglishName("rejuvenating-revive"),
        name: getPictoName("rejuvenating-revive"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("rejuvenating-revive"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "revive-with-shell",
        imageId: getPictoEnglishName("revive-with-shell"),
        name: getPictoName("revive-with-shell"),
        status: {},
        description: getPictoDescription("revive-with-shell"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "solidifying",
        imageId: getPictoEnglishName("solidifying"),
        name: getPictoName("solidifying"),
        status: {
            defense: 647,
            speed: 266
        },
        description: getPictoDescription("solidifying"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "powerful-revive",
        imageId: getPictoEnglishName("powerful-revive"),
        name: getPictoName("powerful-revive"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("powerful-revive"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "revive-with-rush",
        imageId: getPictoEnglishName("revive-with-rush"),
        name: getPictoName("revive-with-rush"),
        status: {},
        description: getPictoDescription("revive-with-rush"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "the-one",
        imageId: getPictoEnglishName("the-one"),
        name: getPictoName("the-one"),
        status: {
            criticalRate: 69
        },
        description: getPictoDescription("the-one"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "dead-energy-ii",
        imageId: getPictoEnglishName("dead-energy-ii"),
        name: getPictoName("dead-energy-ii"),
        status: {
            speed: 140,
            criticalRate: 35
        },
        description: getPictoDescription("dead-energy-ii"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "frozen-shot",
        imageId: getPictoEnglishName("frozen-shot"),
        name: getPictoName("frozen-shot"),
        status: {},
        description: getPictoDescription("frozen-shot"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "piercing-shot",
        imageId: getPictoEnglishName("piercing-shot"),
        name: getPictoName("piercing-shot"),
        status: {
            health: 1403,
            criticalRate: 23
        },
        description: getPictoDescription("piercing-shot"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "burning-dodge",
        imageId: getPictoEnglishName("burning-dodge"),
        name: getPictoName("burning-dodge"),
        status: {},
        description: getPictoDescription("burning-dodge"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "defense-breaker-dodge",
        imageId: getPictoEnglishName("defense-breaker-dodge"),
        name: getPictoName("defense-breaker-dodge"),
        status: {},
        description: getPictoDescription("defense-breaker-dodge"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "defense-riser-dodge",
        imageId: getPictoEnglishName("defense-riser-dodge"),
        name: getPictoName("defense-riser-dodge"),
        status: {},
        description: getPictoDescription("defense-riser-dodge"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "hazardous-choice",
        imageId: getPictoEnglishName("hazardous-choice"),
        name: getPictoName("hazardous-choice"),
        status: {},
        description: getPictoDescription("hazardous-choice"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "healing-death",
        imageId: getPictoEnglishName("healing-death"),
        name: getPictoName("healing-death"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("healing-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "auto-death",
        imageId: getPictoEnglishName("auto-death"),
        name: getPictoName("auto-death"),
        status: {
            criticalRate: 60
        },
        description: getPictoDescription("auto-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "auto-curse",
        imageId: getPictoEnglishName("auto-curse"),
        name: getPictoName("auto-curse"),
        status: {
            speed: 140,
            criticalRate: 35
        },
        description: getPictoDescription("auto-curse"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "death-bomb",
        imageId: getPictoEnglishName("death-bomb"),
        name: getPictoName("death-bomb"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("death-bomb"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "energising-death",
        imageId: getPictoEnglishName("energising-death"),
        name: getPictoName("energising-death"),
        status: {
            defense: 681,
            speed: 280
        },
        description: getPictoDescription("energising-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "shielding-death",
        imageId: getPictoEnglishName("shielding-death"),
        name: getPictoName("shielding-death"),
        status: {
            defense: 647,
            speed: 133
        },
        description: getPictoDescription("shielding-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-death",
        imageId: getPictoEnglishName("protecting-death"),
        name: getPictoName("protecting-death"),
        status: {
            health: 1333,
            speed: 266
        },
        description: getPictoDescription("protecting-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "empowering-death",
        imageId: getPictoEnglishName("empowering-death"),
        name: getPictoName("empowering-death"),
        status: {},
        description: getPictoDescription("empowering-death"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "burn-affinity",
        imageId: getPictoEnglishName("burn-affinity"),
        name: getPictoName("burn-affinity"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("burn-affinity"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "frozen-affinity",
        imageId: getPictoEnglishName("frozen-affinity"),
        name: getPictoName("frozen-affinity"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("frozen-affinity"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "inverted-affinity",
        imageId: getPictoEnglishName("inverted-affinity"),
        name: getPictoName("inverted-affinity"),
        status: {
            health: 1403,
            criticalRate: 23
        },
        description: getPictoDescription("inverted-affinity"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "exhausting-power",
        imageId: getPictoEnglishName("exhausting-power"),
        name: getPictoName("exhausting-power"),
        status: {
            health: 1403,
            defense: 681
        },
        description: getPictoDescription("exhausting-power"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "auto-burn",
        imageId: getPictoEnglishName("auto-burn"),
        name: getPictoName("auto-burn"),
        status: {
            speed: 560
        },
        description: getPictoDescription("auto-burn"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "at-deaths-door",
        imageId: getPictoEnglishName("at-deaths-door"),
        name: getPictoName("at-deaths-door"),
        status: {
            defense: 681,
            criticalRate: 23
        },
        description: getPictoDescription("at-deaths-door"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "full-strength",
        imageId: getPictoEnglishName("full-strength"),
        name: getPictoName("full-strength"),
        status: {
            health: 1333,
            defense: 647
        },
        description: getPictoDescription("full-strength"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "painted-power",
        imageId: getPictoEnglishName("painted-power"),
        name: getPictoName("painted-power"),
        status: {
            health: 2806
        },
        description: getPictoDescription("painted-power"),
        color: "yellow",
        luminaCost: 15
    },
    {
        id: "sos-shell",
        imageId: getPictoEnglishName("sos-shell"),
        name: getPictoName("sos-shell"),
        status: {
            defense: 681,
            speed: 280
        },
        description: getPictoDescription("sos-shell"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "sos-power",
        imageId: getPictoEnglishName("sos-power"),
        name: getPictoName("sos-power"),
        status: {
            speed: 280,
            criticalRate: 23
        },
        description: getPictoDescription("sos-power"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "augmented-counter-ii",
        imageId: getPictoEnglishName("augmented-counter-ii"),
        name: getPictoName("augmented-counter-ii"),
        status: {
            defense: 647,
            criticalRate: 22
        },
        description: getPictoDescription("augmented-counter-ii"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "augmented-counter-iii",
        imageId: getPictoEnglishName("augmented-counter-iii"),
        name: getPictoName("augmented-counter-iii"),
        status: {
            defense: 647,
            criticalRate: 22
        },
        description: getPictoDescription("augmented-counter-iii"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "anti-exhaust",
        imageId: getPictoEnglishName("anti-exhaust"),
        name: getPictoName("anti-exhaust"),
        status: {},
        description: getPictoDescription("anti-exhaust"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "sos-rush",
        imageId: getPictoEnglishName("sos-rush"),
        name: getPictoName("sos-rush"),
        status: {
            defense: 681,
            speed: 280
        },
        description: getPictoDescription("sos-rush"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "solidifying-meditation",
        imageId: getPictoEnglishName("solidifying-meditation"),
        name: getPictoName("solidifying-meditation"),
        status: {
            health: 2105,
            defense: 341
        },
        description: getPictoDescription("solidifying-meditation"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "double-burn",
        imageId: getPictoEnglishName("double-burn"),
        name: getPictoName("double-burn"),
        status: {
            speed: 399,
            criticalRate: 11
        },
        description: getPictoDescription("double-burn"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "healing-fire",
        imageId: getPictoEnglishName("healing-fire"),
        name: getPictoName("healing-fire"),
        status: {
            defense: 647,
            speed: 266
        },
        description: getPictoDescription("healing-fire"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "rewarding-mark",
        imageId: getPictoEnglishName("rewarding-mark"),
        name: getPictoName("rewarding-mark"),
        status: {
            defense: 1022,
            speed: 140
        },
        description: getPictoDescription("rewarding-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "double-mark",
        imageId: getPictoEnglishName("double-mark"),
        name: getPictoName("double-mark"),
        status: {
            speed: 532
        },
        description: getPictoDescription("double-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "stun-boost",
        imageId: getPictoEnglishName("stun-boost"),
        name: getPictoName("stun-boost"),
        status: {
            speed: 479,
            criticalRate: 5
        },
        description: getPictoDescription("stun-boost"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "sniper",
        imageId: getPictoEnglishName("sniper"),
        name: getPictoName("sniper"),
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: getPictoDescription("sniper"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "energising-attack-ii",
        imageId: getPictoEnglishName("energising-attack-ii"),
        name: getPictoName("energising-attack-ii"),
        status: {
            defense: 324,
            speed: 399
        },
        description: getPictoDescription("energising-attack-ii"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "cheater",
        imageId: getPictoEnglishName("cheater"),
        name: getPictoName("cheater"),
        status: {
            health: 842,
            speed: 280
        },
        description: getPictoDescription("cheater"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "healing-counter",
        imageId: getPictoEnglishName("healing-counter"),
        name: getPictoName("healing-counter"),
        status: {
            health: 2666
        },
        description: getPictoDescription("healing-counter"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "powerful-shield",
        imageId: getPictoEnglishName("powerful-shield"),
        name: getPictoName("powerful-shield"),
        status: {
            speed: 420,
            criticalRate: 12
        },
        description: getPictoDescription("powerful-shield"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "base-shield",
        imageId: getPictoEnglishName("base-shield"),
        name: getPictoName("base-shield"),
        status: {
            speed: 378,
            criticalRate: 11
        },
        description: getPictoDescription("base-shield"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "in-medias-res",
        imageId: getPictoEnglishName("in-medias-res"),
        name: getPictoName("in-medias-res"),
        status: {
            defense: 971,
            criticalRate: 11
        },
        description: getPictoDescription("in-medias-res"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "shield-breaker",
        imageId: getPictoEnglishName("shield-breaker"),
        name: getPictoName("shield-breaker"),
        status: {
            defense: 971,
            criticalRate: 11
        },
        description: getPictoDescription("shield-breaker"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "shield-affinity",
        imageId: getPictoEnglishName("shield-affinity"),
        name: getPictoName("shield-affinity"),
        status: {
            speed: 266,
            criticalRate: 22
        },
        description: getPictoDescription("shield-affinity"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "critical-moment",
        imageId: getPictoEnglishName("critical-moment"),
        name: getPictoName("critical-moment"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("critical-moment"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "warming-up",
        imageId: getPictoEnglishName("warming-up"),
        name: getPictoName("warming-up"),
        status: { health: 2000, criticalRate: 11 },
        description: getPictoDescription("warming-up"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "glass-canon",
        imageId: getPictoEnglishName("glass-canon"),
        name: getPictoName("glass-canon"),
        status: { speed: 532 },
        description: getPictoDescription("glass-canon"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "faster-than-strong",
        imageId: getPictoEnglishName("faster-than-strong"),
        name: getPictoName("faster-than-strong"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("faster-than-strong"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "shortcut",
        imageId: getPictoEnglishName("shortcut"),
        name: getPictoName("shortcut"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("shortcut"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "defensive-mode",
        imageId: getPictoEnglishName("defensive-mode"),
        name: getPictoName("defensive-mode"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("defensive-mode"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "greater-powerful",
        imageId: getPictoEnglishName("greater-powerful"),
        name: getPictoName("greater-powerful"),
        status: { speed: 133, criticalRate: 33 },
        description: getPictoDescription("greater-powerful"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "greater-shell",
        imageId: getPictoEnglishName("greater-shell"),
        name: getPictoName("greater-shell"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("greater-shell"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "revive-paradox",
        imageId: getPictoEnglishName("revive-paradox"),
        name: getPictoName("revive-paradox"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("revive-paradox"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "greater-rush",
        imageId: getPictoEnglishName("greater-rush"),
        name: getPictoName("greater-rush"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("greater-rush"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "last-stand-critical",
        imageId: getPictoEnglishName("last-stand-critical"),
        name: getPictoName("last-stand-critical"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("last-stand-critical"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "effective-heal",
        imageId: getPictoEnglishName("effective-heal"),
        name: getPictoName("effective-heal"),
        status: { health: 632, defense: 920 },
        description: getPictoDescription("effective-heal"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "shared-care",
        imageId: getPictoEnglishName("shared-care"),
        name: getPictoName("shared-care"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("shared-care"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "powerful-heal",
        imageId: getPictoEnglishName("powerful-heal"),
        name: getPictoName("powerful-heal"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("powerful-heal"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "accelerating-heal",
        imageId: getPictoEnglishName("accelerating-heal"),
        name: getPictoName("accelerating-heal"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("accelerating-heal"),
        color: "green",
        luminaCost: 15,
        effectTriggers: ["on-heal-ally"]
    },
    {
        id: "energising-heal",
        imageId: getPictoEnglishName("energising-heal"),
        name: getPictoName("energising-heal"),
        status: { health: 1333, speed: 266 },
        description: getPictoDescription("energising-heal"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-heal",
        imageId: getPictoEnglishName("protecting-heal"),
        name: getPictoName("protecting-heal"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("protecting-heal"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "confident-fighter",
        imageId: getPictoEnglishName("confident-fighter"),
        name: getPictoName("confident-fighter"),
        status: { health: 667, criticalRate: 33 },
        description: getPictoDescription("confident-fighter"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "healing-share",
        imageId: getPictoEnglishName("healing-share"),
        name: getPictoName("healing-share"),
        status: { health: 1403, criticalRate: 23 },
        description: getPictoDescription("healing-share"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "dead-energy-i",
        imageId: getPictoEnglishName("dead-energy-i"),
        name: getPictoName("dead-energy-i"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("dead-energy-i"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "effective-support",
        imageId: getPictoEnglishName("effective-support"),
        name: getPictoName("effective-support"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("effective-support"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "weakness-gain",
        imageId: getPictoEnglishName("weakness-gain"),
        name: getPictoName("weakness-gain"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("weakness-gain"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "patient-fighter",
        imageId: getPictoEnglishName("patient-fighter"),
        name: getPictoName("patient-fighter"),
        status: {},
        description: getPictoDescription("patient-fighter"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energetic-healer",
        imageId: getPictoEnglishName("energetic-healer"),
        name: getPictoName("energetic-healer"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("energetic-healer"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "beneficial-contamination",
        imageId: getPictoEnglishName("beneficial-contamination"),
        name: getPictoName("beneficial-contamination"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("beneficial-contamination"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "perfect-reward",
        imageId: getPictoEnglishName("perfect-reward"),
        name: getPictoName("perfect-reward"),
        status: {},
        description: getPictoDescription("perfect-reward"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "roulette",
        imageId: getPictoEnglishName("roulette"),
        name: getPictoName("roulette"),
        status: { defense: 681, criticalRate: 23 },
        description: getPictoDescription("roulette"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "soul-eater",
        imageId: getPictoEnglishName("soul-eater"),
        name: getPictoName("soul-eater"),
        status: { criticalRate: 46 },
        description: getPictoDescription("soul-eater"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "painter",
        imageId: getPictoEnglishName("painter"),
        name: getPictoName("painter"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("painter"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "immaculate",
        imageId: getPictoEnglishName("immaculate"),
        name: getPictoName("immaculate"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("immaculate"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "tainted",
        imageId: getPictoEnglishName("tainted"),
        name: getPictoName("tainted"),
        status: { defense: 1022, criticalRate: 12 },
        description: getPictoDescription("tainted"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "first-offensive",
        imageId: getPictoEnglishName("first-offensive"),
        name: getPictoName("first-offensive"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("first-offensive"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "cursed-power",
        imageId: getPictoEnglishName("cursed-power"),
        name: getPictoName("cursed-power"),
        status: { health: 702, speed: 280, criticalRate: 12 },
        description: getPictoDescription("cursed-power"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "pro-retreat",
        imageId: getPictoEnglishName("pro-retreat"),
        name: getPictoName("pro-retreat"),
        status: { health: 1123, speed: 224 },
        description: getPictoDescription("pro-retreat"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "enfeebling-mark",
        imageId: getPictoEnglishName("enfeebling-mark"),
        name: getPictoName("enfeebling-mark"),
        status: { defense: 971, speed: 133 },
        description: getPictoDescription("enfeebling-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "burning-mark",
        imageId: getPictoEnglishName("burning-mark"),
        name: getPictoName("burning-mark"),
        status: { health: 667, defense: 971 },
        description: getPictoDescription("burning-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "powerful-mark",
        imageId: getPictoEnglishName("powerful-mark"),
        name: getPictoName("powerful-mark"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("powerful-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "healing-mark",
        imageId: getPictoEnglishName("healing-mark"),
        name: getPictoName("healing-mark"),
        status: { defense: 1294 },
        description: getPictoDescription("healing-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "stay-marked",
        imageId: getPictoEnglishName("stay-marked"),
        name: getPictoName("stay-marked"),
        status: { speed: 346, criticalRate: 16 },
        description: getPictoDescription("stay-marked"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charybde-to-scylla",
        imageId: getPictoEnglishName("charybde-to-scylla"),
        name: getPictoName("charybde-to-scylla"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("charybde-to-scylla"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "burning-shots",
        imageId: getPictoEnglishName("burning-shots"),
        name: getPictoName("burning-shots"),
        status: { speed: 504, criticalRate: 5 },
        description: getPictoDescription("burning-shots"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "free-aim-inverted-shot",
        imageId: getPictoEnglishName("free-aim-inverted-shot"),
        name: getPictoName("free-aim-inverted-shot"),
        status: { speed: 504, criticalRate: 5 },
        description: getPictoDescription("free-aim-inverted-shot"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "marking-shots",
        imageId: getPictoEnglishName("marking-shots"),
        name: getPictoName("marking-shots"),
        status: { speed: 504, criticalRate: 5 },
        description: getPictoDescription("marking-shots"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "powerful-shots",
        imageId: getPictoEnglishName("powerful-shots"),
        name: getPictoName("powerful-shots"),
        status: { health: 2526, defense: 137 },
        description: getPictoDescription("powerful-shots"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-shots",
        imageId: getPictoEnglishName("protecting-shots"),
        name: getPictoName("protecting-shots"),
        status: { health: 2526, defense: 137 },
        description: getPictoDescription("protecting-shots"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "accelerating-shots",
        imageId: getPictoEnglishName("accelerating-shots"),
        name: getPictoName("accelerating-shots"),
        status: { health: 2526, defense: 137 },
        description: getPictoDescription("accelerating-shots"),
        color: "green",
        luminaCost: 15,
        effectTriggers: ["on-free-aim"]
    },
    {
        id: "energising-shots",
        imageId: getPictoEnglishName("energising-shots"),
        name: getPictoName("energising-shots"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("energising-shots"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "versatile",
        imageId: getPictoEnglishName("versatile"),
        name: getPictoName("versatile"),
        status: { speed: 420, criticalRate: 12 },
        description: getPictoDescription("versatile"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "empowering-attack",
        imageId: getPictoEnglishName("empowering-attack"),
        name: getPictoName("empowering-attack"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("empowering-attack"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-attack",
        imageId: getPictoEnglishName("protecting-attack"),
        name: getPictoName("protecting-attack"),
        status: { health: 2000, defense: 324 },
        description: getPictoDescription("protecting-attack"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "enfeebling-attack",
        imageId: getPictoEnglishName("enfeebling-attack"),
        name: getPictoName("enfeebling-attack"),
        status: { health: 667, defense: 971 },
        description: getPictoDescription("enfeebling-attack"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "exposing-attack",
        imageId: getPictoEnglishName("exposing-attack"),
        name: getPictoName("exposing-attack"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("exposing-attack"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "empowering-parry",
        imageId: getPictoEnglishName("empowering-parry"),
        name: getPictoName("empowering-parry"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("empowering-parry"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "accelerating-last-stand",
        imageId: getPictoEnglishName("accelerating-last-stand"),
        name: getPictoName("accelerating-last-stand"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("accelerating-last-stand"),
        color: "green",
        luminaCost: 15,
        effectTriggers: ["on-battle-start", "on-turn-start"]
    },
    {
        id: "empowering-last-stand",
        imageId: getPictoEnglishName("empowering-last-stand"),
        name: getPictoName("empowering-last-stand"),
        status: { health: 1403, criticalRate: 23 },
        description: getPictoDescription("empowering-last-stand"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-last-stand",
        imageId: getPictoEnglishName("protecting-last-stand"),
        name: getPictoName("protecting-last-stand"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("protecting-last-stand"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-pain",
        imageId: getPictoEnglishName("energising-pain"),
        name: getPictoName("energising-pain"),
        status: { health: 2000, defense: 324 },
        description: getPictoDescription("energising-pain"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-jump",
        imageId: getPictoEnglishName("energising-jump"),
        name: getPictoName("energising-jump"),
        status: { health: 667, speed: 399 },
        description: getPictoDescription("energising-jump"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "powered-attack",
        imageId: getPictoEnglishName("powered-attack"),
        name: getPictoName("powered-attack"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("powered-attack"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "combo-attack-ii",
        imageId: getPictoEnglishName("combo-attack-ii"),
        name: getPictoName("combo-attack-ii"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("combo-attack-ii"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "combo-attack-iii",
        imageId: getPictoEnglishName("combo-attack-iii"),
        name: getPictoName("combo-attack-iii"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("combo-attack-iii"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "breaker",
        imageId: getPictoEnglishName("breaker"),
        name: getPictoName("breaker"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("breaker"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "staggering-attack",
        imageId: getPictoEnglishName("staggering-attack"),
        name: getPictoName("staggering-attack"),
        status: { speed: 420, criticalRate: 12 },
        description: getPictoDescription("staggering-attack"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "energising-break",
        imageId: getPictoEnglishName("energising-break"),
        name: getPictoName("energising-break"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("energising-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "quick-break",
        imageId: getPictoEnglishName("quick-break"),
        name: getPictoName("quick-break"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("quick-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "empowering-break",
        imageId: getPictoEnglishName("empowering-break"),
        name: getPictoName("empowering-break"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("empowering-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "breaking-shots",
        imageId: getPictoEnglishName("breaking-shots"),
        name: getPictoName("breaking-shots"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("breaking-shots"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "fueling-break",
        imageId: getPictoEnglishName("fueling-break"),
        name: getPictoName("fueling-break"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("fueling-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "gradient-fighter",
        imageId: getPictoEnglishName("gradient-fighter"),
        name: getPictoName("gradient-fighter"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("gradient-fighter"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "gradient-recovery",
        imageId: getPictoEnglishName("gradient-recovery"),
        name: getPictoName("gradient-recovery"),
        status: { health: 1403, criticalRate: 23 },
        description: getPictoDescription("gradient-recovery"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "energising-gradient",
        imageId: getPictoEnglishName("energising-gradient"),
        name: getPictoName("energising-gradient"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("energising-gradient"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-attack",
        imageId: getPictoEnglishName("charging-attack"),
        name: getPictoName("charging-attack"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("charging-attack"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "gradient-breaker",
        imageId: getPictoEnglishName("gradient-breaker"),
        name: getPictoName("gradient-breaker"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("gradient-breaker"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "post-gradient",
        imageId: getPictoEnglishName("post-gradient"),
        name: getPictoName("post-gradient"),
        status: {},
        description: getPictoDescription("post-gradient"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-recovery",
        imageId: getPictoEnglishName("charging-recovery"),
        name: getPictoName("charging-recovery"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("charging-recovery"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-counter",
        imageId: getPictoEnglishName("charging-counter"),
        name: getPictoName("charging-counter"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("charging-counter"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-weakness",
        imageId: getPictoEnglishName("charging-weakness"),
        name: getPictoName("charging-weakness"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("charging-weakness"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-mark",
        imageId: getPictoEnglishName("charging-mark"),
        name: getPictoName("charging-mark"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("charging-mark"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "revive-tint-energy",
        imageId: getPictoEnglishName("revive-tint-energy"),
        name: getPictoName("revive-tint-energy"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("revive-tint-energy"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "healing-tint-energy",
        imageId: getPictoEnglishName("healing-tint-energy"),
        name: getPictoName("healing-tint-energy"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("healing-tint-energy"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "empowering-tint",
        imageId: getPictoEnglishName("empowering-tint"),
        name: getPictoName("empowering-tint"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("empowering-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "protecting-tint",
        imageId: getPictoEnglishName("protecting-tint"),
        name: getPictoName("protecting-tint"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("protecting-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "shielding-tint",
        imageId: getPictoEnglishName("shielding-tint"),
        name: getPictoName("shielding-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("shielding-tint"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "accelerating-tint",
        imageId: getPictoEnglishName("accelerating-tint"),
        name: getPictoName("accelerating-tint"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("accelerating-tint"),
        color: "green",
        luminaCost: 15,
        effectTriggers: ["on-healing-tint"]
    },
    {
        id: "better-healing-tint",
        imageId: getPictoEnglishName("better-healing-tint"),
        name: getPictoName("better-healing-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("better-healing-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "cleansing-tint",
        imageId: getPictoEnglishName("cleansing-tint"),
        name: getPictoName("cleansing-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("cleansing-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "great-healing-tint",
        imageId: getPictoEnglishName("great-healing-tint"),
        name: getPictoName("great-healing-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("great-healing-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "great-energy-tint",
        imageId: getPictoEnglishName("great-energy-tint"),
        name: getPictoName("great-energy-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("great-energy-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-tint",
        imageId: getPictoEnglishName("charging-tint"),
        name: getPictoName("charging-tint"),
        status: { health: 1403, defense: 681 },
        description: getPictoDescription("charging-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "time-tint",
        imageId: getPictoEnglishName("time-tint"),
        name: getPictoName("time-tint"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("time-tint"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-burn",
        imageId: getPictoEnglishName("energising-burn"),
        name: getPictoName("energising-burn"),
        status: { defense: 324, speed: 266 },
        description: getPictoDescription("energising-burn"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "breaking-burn",
        imageId: getPictoEnglishName("breaking-burn"),
        name: getPictoName("breaking-burn"),
        status: { speed: 420, criticalRate: 12 },
        description: getPictoDescription("breaking-burn"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "critical-burn",
        imageId: getPictoEnglishName("critical-burn"),
        name: getPictoName("critical-burn"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("critical-burn"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "burning-death",
        imageId: getPictoEnglishName("burning-death"),
        name: getPictoName("burning-death"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("burning-death"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "longer-burn",
        imageId: getPictoEnglishName("longer-burn"),
        name: getPictoName("longer-burn"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("longer-burn"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "critical-break",
        imageId: getPictoEnglishName("critical-break"),
        name: getPictoName("critical-break"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("critical-break"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "critical-weakness",
        imageId: getPictoEnglishName("critical-weakness"),
        name: getPictoName("critical-weakness"),
        status: { speed: 399, criticalRate: 11 },
        description: getPictoDescription("critical-weakness"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "critical-stun",
        imageId: getPictoEnglishName("critical-stun"),
        name: getPictoName("critical-stun"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("critical-stun"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "critical-vulnerability",
        imageId: getPictoEnglishName("critical-vulnerability"),
        name: getPictoName("critical-vulnerability"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("critical-vulnerability"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "empowering-dodge",
        imageId: getPictoEnglishName("empowering-dodge"),
        name: getPictoName("empowering-dodge"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("empowering-dodge"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "marking-break",
        imageId: getPictoEnglishName("marking-break"),
        name: getPictoName("marking-break"),
        status: { speed: 280, criticalRate: 23 },
        description: getPictoDescription("marking-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "slowing-break",
        imageId: getPictoEnglishName("slowing-break"),
        name: getPictoName("slowing-break"),
        status: { defense: 681, speed: 280 },
        description: getPictoDescription("slowing-break"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "longer-rush",
        imageId: getPictoEnglishName("longer-rush"),
        name: getPictoName("longer-rush"),
        status: { health: 1333, speed: 266 },
        description: getPictoDescription("longer-rush"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "powerful-on-shell",
        imageId: getPictoEnglishName("powerful-on-shell"),
        name: getPictoName("powerful-on-shell"),
        status: { defense: 647, criticalRate: 22 },
        description: getPictoDescription("powerful-on-shell"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "rush-on-powerful",
        imageId: getPictoEnglishName("rush-on-powerful"),
        name: getPictoName("rush-on-powerful"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("rush-on-powerful"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "shell-on-rush",
        imageId: getPictoEnglishName("shell-on-rush"),
        name: getPictoName("shell-on-rush"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("shell-on-rush"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "evasive-healer",
        imageId: getPictoEnglishName("evasive-healer"),
        name: getPictoName("evasive-healer"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("evasive-healer"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-powerful",
        imageId: getPictoEnglishName("energising-powerful"),
        name: getPictoName("energising-powerful"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("energising-powerful"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-shell",
        imageId: getPictoEnglishName("energising-shell"),
        name: getPictoName("energising-shell"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("energising-shell"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-rush",
        imageId: getPictoEnglishName("energising-rush"),
        name: getPictoName("energising-rush"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("energising-rush"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "healing-boon",
        imageId: getPictoEnglishName("healing-boon"),
        name: getPictoName("healing-boon"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("healing-boon"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "greater-powerless",
        imageId: getPictoEnglishName("greater-powerless"),
        name: getPictoName("greater-powerless"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("greater-powerless"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "greater-defenceless",
        imageId: getPictoEnglishName("greater-defenceless"),
        name: getPictoName("greater-defenceless"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("greater-defenceless"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "greater-slow",
        imageId: getPictoEnglishName("greater-slow"),
        name: getPictoName("greater-slow"),
        status: { defense: 647, speed: 266 },
        description: getPictoDescription("greater-slow"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "energising-cleanse",
        imageId: getPictoEnglishName("energising-cleanse"),
        name: getPictoName("energising-cleanse"),
        status: { health: 2000, defense: 324 },
        description: getPictoDescription("energising-cleanse"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "draining-cleanse",
        imageId: getPictoEnglishName("draining-cleanse"),
        name: getPictoName("draining-cleanse"),
        status: { health: 2000, defense: 324 },
        description: getPictoDescription("draining-cleanse"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "anti-blight",
        imageId: getPictoEnglishName("anti-blight"),
        name: getPictoName("anti-blight"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("anti-blight"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "charging-critical",
        imageId: getPictoEnglishName("charging-critical"),
        name: getPictoName("charging-critical"),
        status: { defense: 647, criticalRate: 22 },
        description: getPictoDescription("charging-critical"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-burn",
        imageId: getPictoEnglishName("charging-burn"),
        name: getPictoName("charging-burn"),
        status: { health: 1333, speed: 266 },
        description: getPictoDescription("charging-burn"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-stun",
        imageId: getPictoEnglishName("charging-stun"),
        name: getPictoName("charging-stun"),
        status: { health: 1403, speed: 280 },
        description: getPictoDescription("charging-stun"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "charging-alteration",
        imageId: getPictoEnglishName("charging-alteration"),
        name: getPictoName("charging-alteration"),
        status: { defense: 681, speed: 280 },
        description: getPictoDescription("charging-alteration"),
        color: "green",
        luminaCost: 15
    },
    {
        id: "the-best-defense",
        imageId: getPictoEnglishName("the-best-defense"),
        name: getPictoName("the-best-defense"),
        status: { defense: 1294 },
        description: getPictoDescription("the-best-defense"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "passive-defense",
        imageId: getPictoEnglishName("passive-defense"),
        name: getPictoName("passive-defense"),
        status: { health: 1403, criticalRate: 23 },
        description: getPictoDescription("passive-defense"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "successive-parry",
        imageId: getPictoEnglishName("successive-parry"),
        name: getPictoName("successive-parry"),
        status: { defense: 681, criticalRate: 23 },
        description: getPictoDescription("successive-parry"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "breaking-attack",
        imageId: getPictoEnglishName("breaking-attack"),
        name: getPictoName("breaking-attack"),
        status: { speed: 266, criticalRate: 22 },
        description: getPictoDescription("breaking-attack"),
        color: "red",
        luminaCost: 15
    },
    {
        id: "anti-charm",
        imageId: getPictoEnglishName("anti-charm"),
        name: getPictoName("anti-charm"),
        status: { health: 1333, defense: 647 },
        description: getPictoDescription("anti-charm"),
        color: "blue",
        luminaCost: 15
    },
    {
        id: "cleas-life",
        imageId: getPictoEnglishName("cleas-life"),
        name: getPictoName("cleas-life"),
        status: { health: 2526 },
        description: getPictoDescription("cleas-life"),
        color: "blue",
        luminaCost: 15
    }
];
