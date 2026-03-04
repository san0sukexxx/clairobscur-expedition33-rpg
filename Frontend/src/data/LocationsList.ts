import { type LocationInfo } from "../api/ResponseModel";

/** IDs dos locais da história principal, na ordem da progressão. */
export const MainStoryLocationIds: string[] = [
    "lumiere", "spring-meadows", "flying-waters", "ancient-sanctuary", "gestral-village",
    "esquies-nest", "stone-wave-cliffs", "forgotten-battlefield", "monocos-station",
    "old-lumiere", "visages", "sirene", "the-monolith", "the-manor", "lumiere-act-3",
];

export const LocationsList: LocationInfo[] = [
    // ── Locais Principais (ordem da história) ──
    {
        id: "lumiere",
        residentNpcIds: ["mime"],
        referenceNpcNames: ["Sophie", "Tiffanie", "Marie", "Cyril", "Estelle", "Ulysse", "Richard", "Eloise", "Raphael", "Ophelie", "Maxime", "Henri", "Nicolas", "Trash-can Man", "Victor", "Benoit", "Tom", "Amandine", "Seba", "Jules", "Michel", "Colette", "Antoine", "Catherine", "Lucien", "Jerome", "Alan", "Lucie", "Tristan", "Bastien", "Alexandre", "Emma", "Young Boy", "Cribappa"],
    },
    {
        id: "spring-meadows",
        residentNpcIds: ["jar", "gatekeeper", "lancer", "volester", "abbest", "mime", "chromatic-lancelier", "eveque"],
    },
    {
        id: "flying-waters",
        residentNpcIds: ["noco", "luster", "demineur", "bruler", "cruler", "mime", "bourgeon", "chromatic-troubadour", "goblu"],
    },
    {
        id: "ancient-sanctuary",
        residentNpcIds: ["petank", "robust-sakapatate", "catapult-sakapatate", "ranger-sakapatate", "mime", "ultimate-sakapatate"],
        referenceNpcNames: ["Young Boy", "Karatom"],
    },
    {
        id: "gestral-village",
        residentNpcIds: ["noco", "gestral-warrior", "golgra", "jujubree", "eesda"],
        referenceNpcNames: ["Gestral", "Gestral Kid", "Lorieniso", "Alexcyclo", "Gestral Worker", "Victorifo", "Tall Gestral", "Olivierso", "Gestral Merchant", "Berrami", "Shady Gestral", "Delsitra", "Alexsoundro", "Gestral Doctor", "Ono-Puncho", "Limonsol", "Bertrand Big Hands", "Dominique Giant Feet", "Matthieu the Colossus"],
    },
    {
        id: "esquies-nest",
        residentNpcIds: ["esquie", "mime", "petank", "francois"],
        referenceNpcNames: ["Sunniso"],
    },
    {
        id: "stone-wave-cliffs",
        residentNpcIds: ["jerijeri", "hexga", "reaper-cultist", "greatsword-cultist", "gold-chevaliere", "petank", "rocher", "lampmaster", "chromatic-gault"],
        referenceNpcNames: ["White-Haired Man"],
    },
    {
        id: "forgotten-battlefield",
        residentNpcIds: ["chalier", "petank", "ramasseur", "troubadour", "cruler-battlefield", "dualliste", "chromatic-luster"],
        referenceNpcNames: ["Fading Woman", "Kasumi"],
    },
    {
        id: "monocos-station",
        residentNpcIds: ["stalact"],
        referenceNpcNames: ["Grandis Guard", "Grandis Fashionist", "Grumpy Grandis", "Arguing Grandis", "Troublesome Grandis", "Grateful Grandis", "Grandis Scout", "Grandis Merchant"],
    },
    {
        id: "old-lumiere",
        residentNpcIds: ["steel-chevaliere", "ceramic-chevaliere", "gold-chevaliere", "renoir", "chromatic-danseuses"],
        referenceNpcNames: ["Mandelgo"],
    },
    {
        id: "visages",
        residentNpcIds: ["boucheclier", "contortionniste-visages", "moissoneusse-visages", "chapelier", "chromatic-ramasseur", "mime", "seething-boucheclier", "jovial-moissonneuse", "sorrowful-chapelier", "visages", "mask-keeper"],
        referenceNpcNames: ["Blooraga", "Fading Man"],
    },
    {
        id: "sirene",
        residentNpcIds: ["ballet-sirene", "chorale", "benisseur", "petank", "mime", "chromatic-greatsword-cultist", "tisseur", "glissando", "sirene"],
        referenceNpcNames: ["Klaudiso"],
    },
    {
        id: "the-monolith",
        residentNpcIds: ["lancer-monolith", "abbest-monolith", "gatekeeper-monolith", "clair", "bruler-monolith", "cruler-monolith", "demineur-monolith", "ranger-sakapatate-monolith", "robust-sakapatate-monolith", "catapult-sakapatate-monolith", "reaper-cultist-monolith", "greatsword-cultist-monolith", "petank-monolith", "mime-monolith", "obscur", "hexga-monolith", "chalier-monolith", "troubadour-monolith", "ramasseur-monolith", "danseuses", "ceramic-chevaliere-monolith", "gold-chevaliere-monolith", "pelerin", "braseleur", "the-paintress", "eveque-monolith", "chromatic-bourgeon", "ultimate-sakapatate-monolith", "gargant", "clair-obscur", "renoir-monolith", "chromatic-clair-obscur"],
        referenceNpcNames: ["Mistra", "Melosh"],
    },
    {
        id: "the-manor",
        residentNpcIds: ["the-curator", "clea", "gold-chevaliere-manor", "rocher-manor"],
        referenceNpcNames: ["Gestral Worker", "Gestral"],
    },
    {
        id: "lumiere-act-3",
        residentNpcIds: ["aberration-act3", "contortionniste-act3", "moissoneusse-act3", "orphelin-act3", "ballet-act3", "mime-act3", "lumiere-citizen-act3", "renoir-act3", "creation-act3", "chromatic-echassier"],
    },

    // ── Hubs ──
    {
        id: "camp",
        residentNpcIds: ["noco", "esquie", "the-curator", "chromatic-glissando", "alicia", "golgra", "francois"],
        referenceNpcNames: ["Sastro"],
    },
    {
        id: "the-continent",
        residentNpcIds: ["volester", "gatekeeper", "abbest", "lancer", "pelerin", "ramasseur", "greatsword-cultist", "bruler", "luster", "cruler", "demineur", "bourgeon", "chromatic-bruler"],
        referenceNpcNames: ["Jumeliba", "Carrabi", "Blabary", "Granasori", "Colaro", "Sastro", "Strabami"],
    },

    // ── Sub-locais / Áreas opcionais ──
    {
        id: "abbest-cave",
        residentNpcIds: ["chromatic-abbest"],
    },
    { id: "ancient-gestral-city" },
    { id: "blades-graveyard" },
    { id: "boat-graveyard" },
    {
        id: "coastal-cave",
        residentNpcIds: ["cruler", "bruler"],
    },
    {
        id: "crimson-forest",
        residentNpcIds: ["gold-chevaliere", "obscur", "clair", "chromatic-gold-chevaliere"],
    },
    {
        id: "crushing-cavern",
        referenceNpcNames: ["Giant Sapling"],
    },
    {
        id: "dark-gestral-arena",
        residentNpcIds: ["chromatic-catapult-sakapatate", "chromatic-ranger-sakapatate", "chromatic-robust-sakapatate", "golgra"],
        referenceNpcNames: ["Gestral Pot"],
    },
    {
        id: "dark-shores",
        residentNpcIds: ["noir"],
    },
    {
        id: "endless-night-sanctuary",
        residentNpcIds: ["ranger-sakapatate", "robust-sakapatate", "catapult-sakapatate", "petank", "ultimate-sakapatate", "chromatic-cruler"],
        referenceNpcNames: ["Grandis Engineer", "Anthonypo", "Grandis Explorer"],
    },
    {
        id: "endless-tower",
        residentNpcIds: [
            "gault", "luster", "ramasseur", "potier", "steel-chevaliere", "greatsword-cultist", "dualliste",
            "troubadour", "demineur", "benisseur", "volester", "reaper-cultist", "ballet", "chapelier",
            "lampmaster", "echassier", "hexga", "cruler", "chromatic-benisseur", "boucheclier", "clair",
            "chromatic-abbest", "goblu", "chromatic-orphelin", "ceramic-chevaliere", "bourgeon", "jar",
            "rocher", "chromatic-echassier", "moissoneusse", "catapult-sakapatate", "chromatic-veilleur",
            "bruler", "orphelin", "chromatic-greatsword-cultist", "sapling", "chromatic-troubadour",
            "chromatic-aberration", "danseuses", "stalact", "gatekeeper", "chromatic-braseleur", "glaise",
            "pelerin", "gargant", "noir", "flame-eveque", "chromatic-gold-chevaliere", "chromatic-bruler",
            "aberration", "ultimate-sakapatate", "francois", "robust-sakapatate", "chromatic-lancelier",
            "chromatic-boucheclier", "chromatic-glaise", "obscur", "chromatic-eveque", "chromatic-ballet",
            "thunder-eveque", "chromatic-demineur", "frost-eveque", "chromatic-danseuses", "chromatic-portier",
            "chromatic-steel-chevaliere", "chromatic-ceramic-chevaliere", "chromatic-chalier", "chromatic-jar",
            "chromatic-moissonneuse", "mask-keeper", "creation", "chromatic-clair-obscur",
            "painted-love", "chromatic-lampmaster", "duollistes", "clea-unleashed", "simon-the-divergent-star",
        ],
        referenceNpcNames: ["Fading Woman"],
    },
    {
        id: "esoteric-ruins",
        residentNpcIds: ["gatekeeper"],
        referenceNpcNames: ["Friendly Portier"],
    },
    {
        id: "falling-leaves",
        residentNpcIds: ["gault", "sapling", "glaise", "scavenger", "chromatic-ballet"],
        referenceNpcNames: ["Young Boy", "Lady of Sap", "Persik"],
    },
    {
        id: "floating-cemetery",
        residentNpcIds: ["chalier"],
    },
    {
        id: "flying-casino",
        referenceNpcNames: ["Gestral"],
    },
    {
        id: "flying-manor",
        residentNpcIds: [
            "jar", "pelerin", "braseleur", "danseuses", "hexga", "gatekeeper", "cruler",
            "ceramic-chevaliere", "reaper-cultist", "lancer", "ramasseur", "abbest", "glaise",
            "greatsword-cultist", "petank", "bourgeon", "steel-chevaliere", "gold-chevaliere",
            "mime", "sapling", "stalact", "grosse-tete",
            "gargant", "lampmaster", "flame-eveque", "frost-eveque", "thunder-eveque", "goblu", "dualliste", "clea",
        ],
        referenceNpcNames: ["Gestral", "Young Boy", "Faceless Boy", "Fusoka"],
    },
    {
        id: "frozen-hearts",
        residentNpcIds: ["pelerin", "danseuses", "braseleur", "stalact", "petank", "mime", "chromatic-veilleur", "gargant"],
        referenceNpcNames: ["Gestral", "Danseuse Teacher", "Verogo"],
    },
    {
        id: "gestral-beach",
        referenceNpcNames: ["Gestrals"],
    },
    {
        id: "hidden-gestral-arena",
        referenceNpcNames: ["Bertrand Big Hands", "Dominique Giant Feet", "Julien Tiny Head", "Matthieu the Colossus", "Bagara"],
    },
    {
        id: "isle-of-the-eyes",
        residentNpcIds: ["petank", "chromatic-boucheclier"],
    },
    { id: "lost-woods" },
    {
        id: "painting-workshop",
        residentNpcIds: ["lampmaster"],
        referenceNpcNames: ["Faceless Boy"],
    },
    {
        id: "red-woods",
        residentNpcIds: ["benisseur"],
    },
    {
        id: "renoirs-drafts",
        residentNpcIds: ["benisseur", "ballet", "aberration", "pelerin", "veilleur", "orphelin", "boucheclier", "echassier", "moissoneusse", "contortionniste", "chromatic-creation", "creation"],
        referenceNpcNames: ["Fading Man", "Grour"],
    },
    {
        id: "sacred-river",
        residentNpcIds: ["golgra", "noco"],
    },
    {
        id: "sinister-cave",
        residentNpcIds: ["chromatic-chalier"],
    },
    {
        id: "sirenes-dress",
        residentNpcIds: ["ballet", "chromatic-glissando"],
        referenceNpcNames: ["Pearo"],
    },
    {
        id: "sky-island",
        residentNpcIds: ["chromatic-glaise"],
    },
    {
        id: "stone-quarry",
        referenceNpcNames: ["White Troubadour", "Blanche Nevron"],
    },
    {
        id: "stone-wave-cliffs-cave",
        residentNpcIds: ["chromatic-hexga"],
    },
    {
        id: "sunless-cliffs",
        residentNpcIds: ["mime"],
    },
    {
        id: "the-abyss",
        residentNpcIds: ["simon"],
    },
    { id: "the-canvas" },
    {
        id: "the-carousel",
        referenceNpcNames: ["Grandis"],
    },
    {
        id: "the-chosen-path",
        residentNpcIds: ["glaise", "benisseur", "jar", "stalact", "contortionniste"],
    },
    {
        id: "the-crows",
        residentNpcIds: ["chromatic-chapelier"],
    },
    {
        id: "the-fountain",
        referenceNpcNames: ["Blanche"],
    },
    { id: "the-meadows" },
    {
        id: "the-reacher",
        residentNpcIds: ["orphelin", "echassier", "mime", "petank", "veilleur", "chromatic-braseleur", "alicia"],
        referenceNpcNames: ["Fading Man", "Eragol"],
    },
    {
        id: "the-small-bourgeon",
        residentNpcIds: ["bourgeon", "grown-bourgeon"],
    },
    { id: "twilight-quarry" },
    {
        id: "versos-drafts",
        residentNpcIds: ["half-baked-gestral", "barbasucette", "franctale", "licorne", "machinapieds", "chromatic-barbasucette", "chromatic-franctale", "chromatic-machinapieds", "licornapieds", "osquio"],
        referenceNpcNames: ["Half-Baked Lifeguard", "Monsieur Frappe", "Very Very Cool Gestral", "Najabla"],
    },
    { id: "white-sands" },
    { id: "white-tree" },
    {
        id: "yellow-harvest",
        residentNpcIds: ["gault", "jar", "potier", "mime", "glaise", "chromatic-orphelin"],
        referenceNpcNames: ["Pinabby", "Young Boy"],
    },
    {
        id: "root-of-all-evil",
        residentNpcIds: ["osquio"],
    },
];
