import { Auras } from "./auras"
import { StatRatingsIn } from "./player"

export enum Spells {
  Smite = "smite",
  Shield = "shield",
  Radiance = "radiance",
  Solace = "solace",
  Boon = "boon",
  AscendedBlast = "ascendedblast",
  AscendedNova = "ascendednova",
  Pain = "pain",
}

export enum Targetting {
  Self,
  Enemy,
}

export interface Spell {
  id: Spells
  cast: number
  targetting: Targetting
  dot?: {
    duration: number
    interval: number
  }
  applyAura?: Auras
  getDamage?: (stats: StatRatingsIn) => number
  getHealing?: (stats: StatRatingsIn) => number
}

const Smite: Spell = {
  id: Spells.Smite,
  targetting: Targetting.Enemy,
  cast: 1.5,
  getDamage: ({ intellect }) => intellect * 0.47,
}

const Pain: Spell = {
  id: Spells.Pain,
  targetting: Targetting.Enemy,
  cast: 0,
  dot: {
    duration: 12,
    interval: 2,
  },
  getDamage(stats) {
    return 0.1292 * stats.intellect
  },
  applyAura: Auras.Pain,
}

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
  [Spells.Pain]: Pain,
}
