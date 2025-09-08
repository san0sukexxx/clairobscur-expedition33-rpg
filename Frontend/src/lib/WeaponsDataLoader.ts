// src/lib/WeaponsDataLoader.ts
import type { WeaponDTO } from "../types/WeaponDTO";

// Carrega todos os JSONs em build time, sem fetch.
const modules = import.meta.glob<true, string, WeaponDTO[] | WeaponDTO>(
  "/src/data/weapons/*.json",
  { eager: true, import: "default" }
);

/**
 * WeaponsDataLoader
 * - Não mistura arquivos.
 * - Acesso por nome do arquivo (ex.: "melee.json") ou pelo caminho absoluto retornado pelo glob.
 * - Normaliza caso algum JSON exporte um único objeto em vez de array.
 */
export class WeaponsDataLoader {
  // Mapa: caminho absoluto -> lista de armas
  private static byPath: Map<string, WeaponDTO[]> | null = null;
  // Mapa: nome do arquivo (ex.: melee.json) -> lista de armas
  private static byFile: Map<string, WeaponDTO[]> | null = null;

  /** Inicializa e normaliza os dados uma única vez. */
  private static ensureInitialized(): void {
    if (this.byPath && this.byFile) return;

    this.byPath = new Map();
    this.byFile = new Map();

    for (const [absPath, exported] of Object.entries(modules)) {
      const arr = Array.isArray(exported) ? exported : [exported];
      const fileName = absPath.split("/").pop()!;

      this.byPath.set(absPath, arr);
      this.byFile.set(fileName, arr);
    }
  }

  /** Lista os nomes dos arquivos disponíveis (ex.: ["melee.json","ranged.json"]). */
  static listFiles(): string[] {
    this.ensureInitialized();
    return Array.from(this.byFile!.keys()).sort();
  }

  /** Retorna as armas de um arquivo pelo **nome** (ex.: "melee.json"). */
  static getByFile(fileName: string): WeaponDTO[] {
    this.ensureInitialized();
    const data = this.byFile!.get(fileName);
    if (!data) {
      throw new Error(
        `Arquivo não encontrado: ${fileName}. Disponíveis: ${this.listFiles().join(", ")}`
      );
    }
    return data;
  }

  /** Retorna as armas de um arquivo pelo **caminho absoluto** do glob. */
  static getByPath(absPath: string): WeaponDTO[] {
    this.ensureInitialized();
    const data = this.byPath!.get(absPath);
    if (!data) {
      const available = Array.from(this.byPath!.keys()).join(", ");
      throw new Error(`Caminho não encontrado: ${absPath}. Disponíveis: ${available}`);
    }
    return data;
  }

  /** Conveniência: verifica se um arquivo existe (pelo nome). */
  static hasFile(fileName: string): boolean {
    this.ensureInitialized();
    return this.byFile!.has(fileName);
  }

  /** Conveniência: retorna um mapa imutável nomeDoArquivo -> armas. */
  static getAllSeparated(): ReadonlyMap<string, ReadonlyArray<WeaponDTO>> {
    this.ensureInitialized();
    return this.byFile!;
  }

    // { id: "maelle", label: "Maelle" },
    // { id: "sciel", label: "Sciel" },
    // { id: "lune", label: "Lune" },
    // { id: "monoco", label: "Monoco" },
  static fileForCharacter(character?: string): string {
    switch (character) {
      case "gustave":
      case "verso":
        return "weapon_swords.json";

      case "maelle":
        return "weapons_maelle.json";

      case "monoco":
        return "weapons_monoco.json";

      case "sciel":
        return "weapons_sciel.json";

      case "lune":
        return "weapons_lune.json";

      // fallback
      default:
        return "weapon_swords.json";
    }
  }
}
