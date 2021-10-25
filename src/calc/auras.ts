import { EncounterState } from "."
import { CombatEvent, PickFromUn } from "./events"
import { StatRatingsIn } from "./player"
import { Link } from "./ScheduledEvents"

export enum Auras {
  Atonement = "atonement",
  Schism = "schism-aura",
  Pain = "pain-aura",
  Boon = "boon-aura",
}

export interface Aura {
  id: Auras
  caster: string
  eventReference: number
  appliedAt: number
  expiredAt: number
  stacks?: number
  links: Link[]
}

export interface AuraInfo {
  id: Auras
  duration: number
  dot?: {
    interval: number
    getDoTDamage: (stats: StatRatingsIn) => number
  }
  onExpire?: (event: PickFromUn<CombatEvent, "aura_remove">, encounter: EncounterState) => void
}

const Pain: AuraInfo = {
  id: Auras.Pain,
  duration: 12,
  dot: {
    interval: 2,
    getDoTDamage(stats) {
      return 0.57528 * stats.intellect
    },
  },
}

const Atonement: AuraInfo = {
  id: Auras.Atonement,
  duration: 12,
}

const Boon: AuraInfo = {
  id: Auras.Boon,
  duration: 10,
  onExpire(event, encounter) {
    const { Spells, spells } = require("./spells") as typeof import("./spells")
    const player = encounter.friendlyUnitsIdx.get(event.target)!
    const eruptionSpell = spells[Spells.AscendedEruption]
    const currentTarget = encounter.getSpellTarget(
      spells[Spells.AscendedEruption],
      event.target
    )[0]!
    const mult = currentTarget.getAura(Auras.Schism) ? 1.25 : 1
    const dmg = eruptionSpell.getDamage!(player.stats.getStatRatings(), player) * mult
    encounter.scheduledEvents.push({
      time: encounter.time,
      event: {
        type: "dmg",
        id: encounter.createEventId(),
        source: event.target,
        target: currentTarget?.id!,
        value: dmg,
        spell: Spells.AscendedEruption,
      },
    })
  },
}

const Schism: AuraInfo = {
  id: Auras.Schism,
  duration: 9,
}

export const auras: Partial<Record<Auras, AuraInfo>> = {
  [Auras.Pain]: Pain,
  [Auras.Atonement]: Atonement,
  [Auras.Boon]: Boon,
  [Auras.Schism]: Schism,
}
