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
    ticks: number
  }
  getDamage?: (stats: StatRatingsIn) => number
  getHealing?: (stats: StatRatingsIn) => number
}

const Smite: Spell = {
  id: Spells.Smite,
  targetting: Targetting.Enemy,
  cast: 1.5,
  getDamage: ({ intellect }) => intellect * 0.47,
}

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
}
