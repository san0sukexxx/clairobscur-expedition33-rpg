import type { SkillResponse } from "../api/ResponseModel";

export const SkillsList: SkillResponse[] = [
        {
          "id": "sciel-focused-foretell",
          "character": "sciel",
          "name": "Focused Foretell",
          "cost": 2,
          "description": "Deals medium single target Physical damage.\n1 hit.\nApplies 2 Foretell.\nApplies 3 additional Foretell if target has 0 Foretell",
          "type": "sun",
          "isGradient": false,
          "image": "Sciel_FocusedForetell.webp"
        },
        {
          "id": "sciel-final-path",
          "character": "sciel",
          "name": "Final Path",
          "cost": 8,
          "description": "Final Path is a Skill in Clair Obscur Expedition 33.\nSkills are unique abilities for the playable Characters of the game; each character consists of a skill tree that requires skill points and other skills to unlock.",
          "type": "moon",
          "isGradient": true,
          "image": "Sciel_FinalPath.webp",
          "isBlocked": true
        },
        {
          "id": "sciel-final-path1",
          "character": "sciel",
          "name": "Final Path1",
          "cost": 8,
          "description": "Final Path is a Skill in Clair Obscur Expedition 33.\nSkills are unique abilities for the playable Characters of the game; each character consists of a skill tree that requires skill points and other skills to unlock.",
          "type": "moon",
          "isGradient": true,
          "image": "Sciel_FinalPath.webp",
          "pre_requisite": ["sciel-final-path"],
          "isBlocked": true
        }
      ]