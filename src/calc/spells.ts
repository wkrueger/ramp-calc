import { EncounterState } from "."
import { Auras } from "./auras"
import { CombatEvent } from "./events"
import { Player, StatRatingsIn } from "./player"

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
  gcd?: number
  cooldown?: number
  targetting: Targetting
  targetCount?: number
  applyAura?: Auras
  auraModifiers?: {
    durationPct?: number // radiance
  }
  travelTime?: number
  passive?: boolean
  getDamage?: (stats: StatRatingsIn, player: Player) => number
  getHealing?: (stats: StatRatingsIn) => number
  onEffect?: (event: CombatEvent, es: EncounterState, caster: Player) => void
  allowed?: (player: Player) => boolean
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
  passive: true,
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

const Boon: Spell = {
  id: Spells.Boon,
  targetting: Targetting.Self,
  cast: 1.5,
  applyAura: Auras.Boon,
}

const Blast: Spell = {
  id: Spells.AscendedBlast,
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.3,
  allowed(player) {
    return player.hasAura(Auras.Boon)
  },
  getDamage({ intellect }) {
    return 1.79 * intellect
  },
  onEffect(ev, encounter, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 5
  },
}

const Nova: Spell = {
  id: Spells.AscendedNova,
  targetting: Targetting.Enemy,
  cast: 0,
  gcd: 0.75,
  allowed(player) {
    return player.hasAura(Auras.Boon)
  },
  getDamage({ intellect }) {
    return 0.74 * intellect
  },
  onEffect(ev, encounter, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 1
  },
}

const Eruption: Spell = {
  id: Spells.AscendedEruption,
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
  getDamage({ intellect }, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    return 2.1 * intellect * (1 + 0.03 * (aura.stacks || 1))
  },
}

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
  [Spells.Pain]: Pain,
  [Spells.Shield]: Shield,
  [Spells.Atonement]: Atonement,
  [Spells.Solace]: Solace,
  [Spells.Radiance]: Radiance,
  [Spells.Boon]: Boon,
  [Spells.AscendedBlast]: Blast,
  [Spells.AscendedEruption]: Eruption,
  [Spells.AscendedNova]: Nova,
}
