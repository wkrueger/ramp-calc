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
  AscendedEruption = "ascendederuption",
  Pain = "pain",
  Atonement = "atonement-heal",
  Penance = "penance",
  Schism = "schism",
}

export enum Targetting {
  Self,
  Enemy,
  Friendly,
  None,
}

export interface Spell {
  id: Spells
  cast: number
  targetting: Targetting
  targetCount?: number
  applyAura?: Auras
  auraModifiers?: {
    durationPct?: number // radiance
  }
  travelTime?: number
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
  getDamage(stats) {
    return 0.1292 * stats.intellect
  },
  applyAura: Auras.Pain,
}

const Shield: Spell = {
  id: Spells.Shield,
  targetting: Targetting.Friendly,
  applyAura: Auras.Atonement,
  cast: 0,
  getHealing({ intellect }) {
    return 1.65 * intellect
  },
}

const Atonement: Spell = {
  id: Spells.Atonement,
  targetting: Targetting.None,
  cast: 0,
}

const Solace: Spell = {
  id: Spells.Solace,
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.4,
  getDamage({ intellect }) {
    return 0.8 * intellect
  },
}

const Radiance: Spell = {
  id: Spells.Radiance,
  targetting: Targetting.Friendly,
  targetCount: 6,
  cast: 2,
  applyAura: Auras.Atonement,
  auraModifiers: {
    durationPct: 0.6,
  },
  getHealing({ intellect }) {
    return intellect * 1.05
  },
}

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
  [Spells.Pain]: Pain,
  [Spells.Shield]: Shield,
  [Spells.Atonement]: Atonement,
  [Spells.Solace]: Solace,
  [Spells.Radiance]: Radiance,
}
